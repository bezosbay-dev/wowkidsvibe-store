#!/usr/bin/env node
// ============================================================
// CREATE ALL PRODUCT METAFIELD DEFINITIONS FOR WOOWFINDS
// ============================================================
//
// HOW TO USE:
//   1. Go to Shopify Admin → Settings → Apps and sales channels → Develop apps
//   2. Open your app (or create one) → Configure Admin API scopes
//   3. Enable these scopes:
//        - read_metafield_definitions, write_metafield_definitions
//        - read_metaobject_definitions, write_metaobject_definitions
//   4. Install/reinstall the app → copy the Admin API access token
//   5. Paste it below on the ADMIN_TOKEN line
//   6. Run:  node scripts/create-metafields.js
//
// This creates 26 product metafield definitions with Storefront API
// access enabled, so the headless website can read them.
// ============================================================

const ADMIN_TOKEN = 'YOUR_ADMIN_API_TOKEN_HERE';  // <-- PASTE HERE
const SHOP_DOMAIN = 'wiowkidz.myshopify.com';
const API_VERSION = '2025-04';

const ADMIN_URL = `https://${SHOP_DOMAIN}/admin/api/${API_VERSION}/graphql.json`;

// ── All metafield definitions to create ─────────────────────
const DEFINITIONS = [
  // Story Section 1
  { key: 'story_image_1',    name: 'Story Image 1',    type: 'file_reference',        description: 'Lifestyle image for product story block 1' },
  { key: 'story_headline_1', name: 'Story Headline 1',  type: 'single_line_text_field', description: 'Headline for product story block 1' },
  { key: 'story_text_1',     name: 'Story Text 1',      type: 'multi_line_text_field',  description: 'Description paragraph for product story block 1' },
  // Story Section 2
  { key: 'story_image_2',    name: 'Story Image 2',    type: 'file_reference',        description: 'Lifestyle image for product story block 2' },
  { key: 'story_headline_2', name: 'Story Headline 2',  type: 'single_line_text_field', description: 'Headline for product story block 2' },
  { key: 'story_text_2',     name: 'Story Text 2',      type: 'multi_line_text_field',  description: 'Description paragraph for product story block 2' },
  // Story Section 3
  { key: 'story_image_3',    name: 'Story Image 3',    type: 'file_reference',        description: 'Lifestyle image for product story block 3' },
  { key: 'story_headline_3', name: 'Story Headline 3',  type: 'single_line_text_field', description: 'Headline for product story block 3' },
  { key: 'story_text_3',     name: 'Story Text 3',      type: 'multi_line_text_field',  description: 'Description paragraph for product story block 3' },

  // What You Get
  { key: 'what_you_get', name: 'What You Get', type: 'multi_line_text_field', description: 'Bullet list of included items (one per line)' },

  // Featured Review 1
  { key: 'featured_review_1_title', name: 'Featured Review 1 Title', type: 'single_line_text_field', description: 'Title for featured review card 1' },
  { key: 'featured_review_1_text',  name: 'Featured Review 1 Text',  type: 'multi_line_text_field',  description: 'Body text for featured review card 1' },
  { key: 'featured_review_1_name',  name: 'Featured Review 1 Name',  type: 'single_line_text_field', description: 'Reviewer name for featured review card 1' },
  { key: 'featured_review_1_stars', name: 'Featured Review 1 Stars', type: 'number_integer',         description: 'Star rating 1-5 for featured review card 1' },
  // Featured Review 2
  { key: 'featured_review_2_title', name: 'Featured Review 2 Title', type: 'single_line_text_field', description: 'Title for featured review card 2' },
  { key: 'featured_review_2_text',  name: 'Featured Review 2 Text',  type: 'multi_line_text_field',  description: 'Body text for featured review card 2' },
  { key: 'featured_review_2_name',  name: 'Featured Review 2 Name',  type: 'single_line_text_field', description: 'Reviewer name for featured review card 2' },
  { key: 'featured_review_2_stars', name: 'Featured Review 2 Stars', type: 'number_integer',         description: 'Star rating 1-5 for featured review card 2' },
  // Featured Review 3
  { key: 'featured_review_3_title', name: 'Featured Review 3 Title', type: 'single_line_text_field', description: 'Title for featured review card 3' },
  { key: 'featured_review_3_text',  name: 'Featured Review 3 Text',  type: 'multi_line_text_field',  description: 'Body text for featured review card 3' },
  { key: 'featured_review_3_name',  name: 'Featured Review 3 Name',  type: 'single_line_text_field', description: 'Reviewer name for featured review card 3' },
  { key: 'featured_review_3_stars', name: 'Featured Review 3 Stars', type: 'number_integer',         description: 'Star rating 1-5 for featured review card 3' },

  // Overall rating badge
  { key: 'overall_rating', name: 'Overall Rating',  type: 'number_decimal', description: 'Overall product rating (e.g. 4.8) shown in social proof banner' },
  { key: 'total_reviews',  name: 'Total Reviews',   type: 'number_integer', description: 'Total review count shown in social proof banner' },

  // FAQ
  { key: 'faq', name: 'FAQ', type: 'json', description: 'FAQ accordion data — JSON array of {"q":"question","a":"answer"} objects' },

  // Related Products
  { key: 'related_products', name: 'Related Products', type: 'list.product_reference', description: 'Hand-picked related/upsell products (up to 8)' },
];

// ── GraphQL mutation ────────────────────────────────────────
const MUTATION = `
  mutation CreateMetafieldDefinition($definition: MetafieldDefinitionInput!) {
    metafieldDefinitionCreate(definition: $definition) {
      createdDefinition {
        id
        name
        key
        namespace
      }
      userErrors {
        field
        message
      }
    }
  }
`;

// ── Helper: make Admin API request ──────────────────────────
async function adminFetch(query, variables) {
  const res = await fetch(ADMIN_URL, {
    method: 'POST',
    headers: {
      'Content-Type': 'application/json',
      'X-Shopify-Access-Token': ADMIN_TOKEN,
    },
    body: JSON.stringify({ query, variables }),
  });
  if (!res.ok) {
    const text = await res.text();
    throw new Error(`Admin API ${res.status}: ${text}`);
  }
  return res.json();
}

// ── Main ────────────────────────────────────────────────────
async function main() {
  if (ADMIN_TOKEN === 'YOUR_ADMIN_API_TOKEN_HERE') {
    console.error('\n  ERROR: Paste your Admin API access token on line 22 of this file.\n');
    console.error('  To get it:');
    console.error('    1. Shopify Admin → Settings → Apps and sales channels → Develop apps');
    console.error('    2. Open/create your app → Admin API access token');
    console.error('    3. Required scopes: read_metafield_definitions, write_metafield_definitions\n');
    process.exit(1);
  }

  console.log(`\nCreating ${DEFINITIONS.length} metafield definitions on ${SHOP_DOMAIN}...\n`);

  let created = 0;
  let skipped = 0;
  let failed = 0;

  for (const def of DEFINITIONS) {
    const variables = {
      definition: {
        name: def.name,
        namespace: 'custom',
        key: def.key,
        type: def.type,
        description: def.description,
        ownerType: 'PRODUCT',
        pin: true,
        access: {
          storefront: 'PUBLIC_READ',
        },
      },
    };

    // file_reference needs fileTypeAccess
    if (def.type === 'file_reference') {
      variables.definition.validations = [
        { name: 'file_type_options', value: '["Image"]' },
      ];
    }

    // number_integer needs integer validation range
    if (def.type === 'number_integer' && def.key.includes('stars')) {
      variables.definition.validations = [
        { name: 'min', value: '1' },
        { name: 'max', value: '5' },
      ];
    }

    try {
      const result = await adminFetch(MUTATION, variables);
      const data = result.data?.metafieldDefinitionCreate;

      if (data?.createdDefinition) {
        console.log(`  ✓ ${def.key} (${def.type})`);
        created++;
      } else if (data?.userErrors?.length > 0) {
        const msg = data.userErrors.map(e => e.message).join('; ');
        if (msg.includes('already exists') || msg.includes('taken')) {
          console.log(`  ○ ${def.key} — already exists, skipped`);
          skipped++;
        } else {
          console.log(`  ✗ ${def.key} — ${msg}`);
          failed++;
        }
      } else {
        console.log(`  ✗ ${def.key} — unexpected response`);
        failed++;
      }
    } catch (err) {
      console.log(`  ✗ ${def.key} — ${err.message}`);
      failed++;
    }

    // Small delay to avoid rate limits
    await new Promise(r => setTimeout(r, 250));
  }

  console.log(`\nDone: ${created} created, ${skipped} already existed, ${failed} failed.\n`);

  if (created > 0 || skipped > 0) {
    console.log('Next steps:');
    console.log('  1. Go to Shopify Admin → Products → any product → scroll to Metafields');
    console.log('  2. Fill in whichever sections you want for that product');
    console.log('  3. Leave blank = section won\'t show on the website\n');
    console.log('FAQ format (paste into the "faq" metafield):');
    console.log('  [{"q":"What ages is this for?","a":"Ages 3-12."},{"q":"Is it safe?","a":"Non-toxic and BPA-free."}]\n');
  }
}

main().catch(err => {
  console.error('Fatal error:', err.message);
  process.exit(1);
});
