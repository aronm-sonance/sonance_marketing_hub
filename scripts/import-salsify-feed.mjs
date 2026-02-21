import fs from 'fs';
import path from 'path';
import { createClient } from '@supabase/supabase-js';

const FEED_PATH = process.argv[2] || '/home/node/.openclaw/workspace/salsify-feed/product-feed (1).json';
const ENV_PATH = '/home/node/.openclaw/workspace/sonance-marketing-hub/.env.local';

async function main() {
  const startTime = Date.now();
  console.log(`Starting Salsify import from: ${FEED_PATH}`);

  // 1. Load env vars manually
  const envContent = fs.readFileSync(ENV_PATH, 'utf8');
  const env = {};
  envContent.split('\n').forEach(line => {
    const match = line.match(/^\s*([\w.-]+)\s*=\s*(.*)?\s*$/);
    if (match) {
      let value = match[2] || '';
      if (value.startsWith('"') && value.endsWith('"')) value = value.slice(1, -1);
      if (value.startsWith("'") && value.endsWith("'")) value = value.slice(1, -1);
      env[match[1]] = value;
    }
  });

  const supabaseUrl = env.NEXT_PUBLIC_SUPABASE_URL;
  const supabaseKey = env.SUPABASE_SERVICE_ROLE_KEY;

  if (!supabaseUrl || !supabaseKey) {
    throw new Error('Missing Supabase credentials in .env.local');
  }

  const supabase = createClient(supabaseUrl, supabaseKey);

  // 2. Read feed
  const feed = JSON.parse(fs.readFileSync(FEED_PATH, 'utf8'));
  // Feed is array of 5 objects: [{header}, {attributes}, {attribute_values}, {digital_assets}, {products}]
  const digitalAssets = feed[3]?.digital_assets || [];
  const productsRaw = feed[4]?.products || [];

  console.log(`Loaded ${productsRaw.length} products and ${digitalAssets.length} assets.`);

  // 3. Build asset lookup map
  const assetMap = new Map();
  digitalAssets.forEach(asset => {
    assetMap.set(asset['salsify:id'], {
      url: asset['salsify:url'],
      filename: asset['salsify:filename']
    });
  });

  const resolveAssets = (hashes) => {
    if (!hashes) return [];
    const hashArray = Array.isArray(hashes) ? hashes : [hashes];
    return hashArray
      .map(hash => assetMap.get(hash))
      .filter(Boolean);
  };

  const resolveSingleAssetUrl = (hash) => {
    const asset = assetMap.get(hash);
    return asset ? asset.url : null;
  };

  // 4. Process products
  const productsToUpsert = [];
  const relationsToUpsert = [];
  const productIds = new Set();

  productsRaw.forEach(p => {
    const id = p['salsify:id'];
    productIds.add(id);

    const specs = {};
    const specFields = {
      'impedance_nom': 'Nominal Impedance',
      'power_handling': 'Power Handling',
      'freq_resp_minus3db': 'Frequency Response (+/- 3dB)',
      'sensitivity': 'Sensitivity',
      'dispersion_technology': 'Dispersion Technology',
      'air_flex_woofer': 'Air Flex Woofer',
      'wave_flex_drive_unit': 'Wave Flex Drive Unit',
      'max_operating_temp_computed': 'Maximum Operating Temperature',
      'min_operating_temp_computed': 'Minimum Operating Temperature',
      'mounting_depth_speaker_only_computed': 'Mounting Depth - Speaker Only',
      'product_depth_pdp_computed': 'Product Depth',
      'product_height_pdp_computed': 'Product Height',
      'product_width_pdp_computed': 'Product Width',
      'product_dimensions_pdp_computed': 'Product Dimensions (WxHxD)',
      'uom_base_weight_pdp_computed': 'Shipping Weight',
      'UOM_Dimensions_Computed': 'Shipping Dimensions',
      'color_finish': 'Color',
      'speaker_size': 'Speaker Size',
      'speaker_aesthetic': 'Speaker Aesthetic',
      'type': 'Type',
      'warranty': 'Warranty',
      'product_brand': 'Brand',
      'product_category': 'Product Category'
    };

    Object.entries(specFields).forEach(([field, label]) => {
      if (p[field] !== undefined && p[field] !== null) {
        specs[label] = p[field];
      }
    });

    productsToUpsert.push({
      id,
      parent_id: p['salsify:parent_id'],
      hierarchy_level: p['salsify:data_inheritance_hierarchy_level_id'],
      brand: p['hierarchy_brand'] || 'Unknown',
      category: p['hierarchy_category'],
      sub_category: p['hierarchy_sub_category'],
      product_model: p['product_model'],
      product_model_long: p['product_model_long'],
      sku: p['sku'],
      description_short: p['description_short'],
      description_medium: p['description_medium'],
      description_long: p['description_long'],
      hero_image_url: p['hero_product_image_large'],
      hero_image_small_url: p['hero_product_image_small'],
      product_images: Array.isArray(p['product_image_large']) ? p['product_image_large'] : (p['product_image_large'] ? [p['product_image_large']] : []),
      lifestyle_image_url: p['lifestyle_image_large'],
      data_sheets: resolveAssets(p['data_sheet']),
      sell_sheet_url: resolveSingleAssetUrl(p['sell_sheet']),
      spec_sheet_url: resolveSingleAssetUrl(p['spec_sheet']),
      cad_files: resolveAssets(p['cad_file']),
      manuals: resolveAssets(p['manual']),
      ease_files: resolveAssets(p['ease_file']),
      eq_file_url: resolveSingleAssetUrl(p['eq_file']),
      install_videos: resolveAssets(p['install_video']),
      video_url: p['https_install_video'],
      specifications: specs,
      features: Array.isArray(p['features']) ? p['features'] : [],
      product_url: p['DP PDP URL Full'],
      color_finish: p['color_finish'],
      type: p['type'],
      speaker_aesthetic: p['speaker_aesthetic'],
      speaker_size: p['speaker_size'],
      warranty: p['warranty'],
      raw_attributes: p,
      salsify_updated_at: p['salsify:updated_at']
    });
  });

  // 5. Extract relations
  productsRaw.forEach(p => {
    const sourceId = p['salsify:id'];
    const relations = p['salsify:relations'] || [];
    
    relations.forEach(rel => {
      const type = rel['relation_type'] || rel['salsify:relation_type'];
      const targetId = rel['salsify:target_product_id'];

      if (['Accessory', 'Part', 'System Component'].includes(type) && productIds.has(targetId)) {
        relationsToUpsert.push({
          source_product_id: sourceId,
          target_product_id: targetId,
          relation_type: type
        });
      }
    });
  });

  // 6. Batch upsert products
  const BATCH_SIZE = 50;
  let productsCount = 0;
  for (let i = 0; i < productsToUpsert.length; i += BATCH_SIZE) {
    const batch = productsToUpsert.slice(i, i + BATCH_SIZE);
    const { error } = await supabase.from('salsify_products').upsert(batch, { onConflict: 'id' });
    if (error) {
      console.error(`Error upserting product batch ${i}:`, error);
    } else {
      productsCount += batch.length;
      process.stdout.write(`\rUpserted ${productsCount}/${productsToUpsert.length} products...`);
    }
  }
  console.log('\nProduct upsert complete.');

  // 7. Batch upsert relations
  let relationsCount = 0;
  for (let i = 0; i < relationsToUpsert.length; i += BATCH_SIZE) {
    const batch = relationsToUpsert.slice(i, i + BATCH_SIZE);
    const { error } = await supabase.from('salsify_product_relations').upsert(batch, { onConflict: 'source_product_id,target_product_id,relation_type' });
    if (error) {
      console.error(`Error upserting relation batch ${i}:`, error);
    } else {
      relationsCount += batch.length;
      process.stdout.write(`\rUpserted ${relationsCount}/${relationsToUpsert.length} relations...`);
    }
  }
  console.log('\nRelation upsert complete.');

  // 8. Log import
  const durationMs = Date.now() - startTime;
  await supabase.from('salsify_import_log').insert({
    filename: path.basename(FEED_PATH),
    products_count: productsCount,
    relations_count: relationsCount,
    duration_ms: durationMs,
    imported_by: 'system_import_script'
  });

  console.log('--- Import Summary ---');
  console.log(`Duration: ${durationMs}ms`);
  console.log(`Products: ${productsCount}`);
  console.log(`Relations: ${relationsCount}`);
  console.log('----------------------');
}

main().catch(err => {
  console.error('Import failed:', err);
  process.exit(1);
});
