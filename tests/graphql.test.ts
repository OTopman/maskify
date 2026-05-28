import { graphql, buildSchema } from 'graphql';
import { graphqlMask } from '../src/graphql';

describe('GraphQL Directive Integration (graphqlMask)', () => {
  it('should mask annotated schema fields using the transformed schema', async () => {
    const schemaSource = `
      directive @mask(
        type: String
        visibleStart: Int
        visibleEnd: Int
        maxAsterisks: Int
        maskChar: String
        pattern: String
        redact: Boolean
        label: String
      ) on FIELD_DEFINITION

      type User {
        id: ID!
        email: String! @mask(type: "email")
        phone: String! @mask(type: "phone", visibleEnd: 2)
        secretCode: String! @mask(redact: true, label: "[CONFIDENTIAL]")
      }

      type SensitiveData {
        apiKey: String
        token: String
      }

      type Query {
        me: User
        secretLogs: [String!]! @mask(type: "generic", maskChar: "x")
        sensitiveData: SensitiveData! @mask
        friends: [User!]! @mask
      }
    `;

    let schema = buildSchema(schemaSource);

    // Apply the directive transformer
    schema = graphqlMask(schema);

    const query = `
      query GetMe {
        me {
          id
          email
          phone
          secretCode
        }
        secretLogs
        sensitiveData {
          apiKey
          token
        }
        friends {
          id
          email
          phone
          secretCode
        }
      }
    `;

    const rootValue = {
      me: () => ({
        id: '123',
        email: 'admin@company.com',
        phone: '+14155554321',
        secretCode: 'super-sensitive-12345',
      }),
      secretLogs: () => [
        'password=123',
        'api_key=xyz',
      ],
      sensitiveData: () => ({
        apiKey: 'key-12345',
        token: 'token-abc',
      }),
      friends: () => [
        {
          id: '456',
          email: 'friend@company.com',
          phone: '+14155559999',
          secretCode: 'friend-secret',
        }
      ]
    };

    const response = await graphql({ schema, source: query, rootValue });
    expect(response.errors).toBeUndefined();

    const data = response.data as any;

    // 1. Single string field masking
    const me = data.me;
    expect(me.id).toBe('123'); // Unchanged (no @mask directive)
    expect(me.email).not.toBe('admin@company.com');
    expect(me.email).toContain('***');
    expect(me.phone).not.toBe('+14155554321');
    expect(me.phone.endsWith('21')).toBe(true);
    expect(me.secretCode).toBe('[CONFIDENTIAL]');

    // 2. Array of strings masking
    expect(data.secretLogs).toBeDefined();
    expect(data.secretLogs[0]).not.toBe('password=123');
    expect(data.secretLogs[0]).toContain('x');

    // 3. Single object autoMasking
    expect(data.sensitiveData).toBeDefined();
    expect(data.sensitiveData.apiKey).not.toBe('key-12345');
    expect(data.sensitiveData.token).not.toBe('token-abc');

    // 4. Array of objects autoMasking
    expect(data.friends).toBeDefined();
    expect(data.friends[0].id).toBe('456');
    expect(data.friends[0].email).not.toBe('friend@company.com');
    expect(data.friends[0].email).toContain('***');
  });
});
