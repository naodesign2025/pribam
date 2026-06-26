// =============================================
// プリバム — Client-side JS
// =============================================

document.addEventListener('DOMContentLoaded', () => {

  // --- Icon preview ---
  const iconInput = document.getElementById('iconInput');
  const iconPreview = document.getElementById('iconPreview');

  if (iconInput && iconPreview) {
    iconInput.addEventListener('change', (e) => {
      const file = e.target.files[0];
      if (!file) return;

      if (file.size > 5 * 1024 * 1024) {
        alert('画像ファイルは5MB以下にしてね！');
        iconInput.value = '';
        return;
      }

      const reader = new FileReader();
      reader.onload = (ev) => {
        iconPreview.src = ev.target.result;
      };
      reader.readAsDataURL(file);
    });
  }

  // --- Character counter ---
  document.querySelectorAll('.char-count').forEach((counter) => {
    const targetName = counter.dataset.target;
    const max = parseInt(counter.dataset.max, 10);
    const textarea = document.querySelector(`[name="${targetName}"]`);

    if (!textarea) return;

    const update = () => {
      const len = textarea.value.length;
      counter.textContent = `${len} / ${max}`;
      counter.style.color = len >= max * 0.9 ? '#E74C6E' : '#777';
    };

    textarea.addEventListener('input', update);
    update();
  });

  // --- Form submit guard (double-submit prevention) ---
  const profileForm = document.getElementById('profileForm');
  if (profileForm) {
    let submitted = false;
    profileForm.addEventListener('submit', (e) => {
      if (submitted) {
        e.preventDefault();
        return;
      }
      const submitBtn = profileForm.querySelector('[type="submit"]');
      if (submitBtn) {
        submitBtn.textContent = '保存中...';
        submitBtn.disabled = true;
      }
      submitted = true;
    });
  }

});
