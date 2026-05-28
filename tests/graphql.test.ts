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

      type Query {
        me: User
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
      }
    `;

    const rootValue = {
      me: () => ({
        id: '123',
        email: 'admin@company.com',
        phone: '+14155554321',
        secretCode: 'super-sensitive-12345',
      }),
    };

    const response = await graphql({ schema, source: query, rootValue });
    expect(response.errors).toBeUndefined();

    const me = response.data?.me as any;
    expect(me.id).toBe('123'); // Unchanged (no @mask directive)
    expect(me.email).not.toBe('admin@company.com');
    expect(me.email).toContain('***');
    expect(me.phone).not.toBe('+14155554321');
    expect(me.phone.endsWith('21')).toBe(true);
    expect(me.secretCode).toBe('[CONFIDENTIAL]');
  });
});
