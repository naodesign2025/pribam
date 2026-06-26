const { createClient } = require('@supabase/supabase-js');

const supabase = createClient(
  process.env.SUPABASE_URL,
  process.env.SUPABASE_SERVICE_ROLE_KEY
);

const BUCKET = 'icons';

async function uploadIcon(userId, fileBuffer, mimetype, ext) {
  const filename = `icon-${userId}-${Date.now()}${ext}`;
  const { data, error } = await supabase.storage
    .from(BUCKET)
    .upload(filename, fileBuffer, { contentType: mimetype, upsert: false });

  if (error) throw error;

  const { data: { publicUrl } } = supabase.storage
    .from(BUCKET)
    .getPublicUrl(data.path);

  return publicUrl;
}

async function deleteIcon(publicUrl) {
  if (!publicUrl) return;
  const marker = `/object/public/${BUCKET}/`;
  const idx = publicUrl.indexOf(marker);
  if (idx === -1) return;
  const filename = publicUrl.slice(idx + marker.length);
  await supabase.storage.from(BUCKET).remove([filename]);
}

module.exports = { uploadIcon, deleteIcon };
