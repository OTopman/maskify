import { Maskify } from '../src';
import { buildSchema, graphql } from 'graphql';
import { graphqlMask } from '../src/graphql'; // or Maskify.graphql

async function run() {
  console.log('--- 1. Conditional Masking with Context ---');
  const userPayload = {
    email: 'jane.doe@company.com',
    phone: '+14155550123',
  };

  const schema = {
    email: {
      type: 'email' as const,
      condition: (val: string, ctx: any) => ctx?.role !== 'admin',
    },
    phone: {
      type: 'phone' as const,
      condition: (val: string, ctx: any) => ctx?.role !== 'admin',
    },
  };

  // Masking with Admin context (should skip masking)
  const adminResult = Maskify.maskSensitiveFields(userPayload, schema, {
    context: { role: 'admin' },
  });
  console.log('Admin view (unmasked):', adminResult);

  // Masking with Support context (should perform masking)
  const supportResult = Maskify.maskSensitiveFields(userPayload, schema, {
    context: { role: 'support' },
  });
  console.log('Support view (masked):', supportResult);

  console.log('\n--- 2. Full Redaction & Classification ---');
  const confidentialDoc = 'jane.doe@company.com';
  
  // Default type-based label
  const defaultRedacted = Maskify.mask(confidentialDoc, { redact: true });
  console.log('Default redacted:', defaultRedacted); // -> [REDACTED_EMAIL]

  // Custom label override
  const customRedacted = Maskify.mask(confidentialDoc, { redact: true, label: '[CONFIDENTIAL]' });
  console.log('Custom label redacted:', customRedacted); // -> [CONFIDENTIAL]

  console.log('\n--- 3. GraphQL Directive Integration ---');
  const schemaSource = `
    directive @mask(type: String, redact: Boolean, label: String) on FIELD_DEFINITION

    type User {
      id: ID!
      email: String! @mask(type: "email")
      phone: String! @mask(type: "phone", redact: true)
    }

    type Query {
      me: User
    }
  `;

  // Build schema and apply the directive transformer
  let gqlSchema = buildSchema(schemaSource);
  gqlSchema = graphqlMask(gqlSchema);

  const query = `
    query {
      me {
        id
        email
        phone
      }
    }
  `;

  // Mock resolver source
  const rootValue = {
    me: () => ({
      id: 'user_99',
      email: 'jane@company.com',
      phone: '+14155550123',
    }),
  };

  const response = await graphql({
    schema: gqlSchema,
    source: query,
    rootValue,
  });

  console.log('GraphQL query response (masked & redacted):', JSON.stringify(response.data, null, 2));
}

run().catch(console.error);
