(() => {
  'use strict';
  const content = window.portfolioContent;
  const translations = {
    zh: {
      skip: '跳转到作品', navWorks: '作品', navAbout: '关于', navContact: '联系 <span aria-hidden="true">↗</span>',
      introEyebrow: '独立视觉探索 / PERSONAL PORTFOLIO', introTitle: '以视觉，<br><span>让想法成形。</span>', introDescription: '图像、文字与物件之间，<br>一些关于设计的探索。', explore: '浏览作品',
      featured: '精选作品', viewWork: '查看作品', previewNote: '框架预览 · 当前图形与文字为临时示意，后续替换为真实作品。',
      worksEyebrow: 'SELECTED WORK / 一些想法，成为了作品。', worksTitle: '<span class="heading-line">设计的</span><span class="heading-line">不同形状<span class="title-dot">.</span></span>', worksNote: '在不同的媒介里，<br>寻找恰好的表达。', aboutTitle: '关于我', cursorView: '查看', projectDetail: 'PROJECT / 项目细节',
      aboutLead: '你好，我是<span class="placeholder-name">{name}</span>。<br>一位关注细节的视觉设计师。', aboutDescription: '这里将放入你的个人介绍：你关注的设计方向、创作方式，以及一小段真实经历。让作品之外的你，也被看见。',
      letsTalk: '聊聊设计，或打个招呼', contactEyebrow: '下一个想法，从一次交流开始。', contactTitle: '保持联系', wechat: '微信联系', email: '邮件联系',
      footerName: '{name} · 视觉设计', backTop: '回到顶部', previousWork: '上一件作品', nextWork: '下一件作品', contactDialogTitle: '很高兴认识你。', contactDialogDescription: '扫描二维码，或复制微信号。',
      previousSlide: '上一件精选作品', nextSlide: '下一件精选作品', chooseSlide: '显示精选作品', closeWork: '关闭作品详情', closeContact: '关闭联系窗口', workCategories: '作品分类',
      contactPending: '框架预览：微信号和二维码尚未补充。', qrPending: '微信二维码待补充', idPending: '微信号待补充', copyId: '复制微信号', copied: '微信号已复制', copyFailed: '暂时无法复制，请手动复制微信号：', emailPending: '邮箱地址尚未补充。', imageFailed: '图片暂时无法显示，请检查文件路径。', image: '图片', placeholder: '临时展示图'
    },
    en: {
      skip: 'Skip to works', navWorks: 'Work', navAbout: 'About', navContact: 'Contact <span aria-hidden="true">↗</span>',
      introEyebrow: 'INDEPENDENT EXPLORATIONS / PORTFOLIO', introTitle: 'Ideas take<br><span>visual form.</span>', introDescription: 'Between images, type and objects.<br>A few explorations in design.', explore: 'Explore work',
      featured: 'Featured', viewWork: 'View work', previewNote: 'Framework preview · Temporary visuals and copy. Your own work will be added later.',
      worksEyebrow: 'SELECTED WORK / A few ideas, made visible.', worksTitle: 'Design in many forms<span class="title-dot">.</span>', worksNote: 'Different mediums.<br>A thoughtful expression.', aboutTitle: 'About me', cursorView: 'View', projectDetail: 'PROJECT / A closer look',
      aboutLead: 'Hello, I’m <span class="placeholder-name">{name}</span>.<br>A visual designer with an eye for detail.', aboutDescription: 'Your introduction goes here: the design fields you explore, your approach to making things, and a little about your experience. A glimpse of the person behind the work.',
      letsTalk: 'Talk design, or just say hello', contactEyebrow: 'The next idea starts with a conversation.', contactTitle: 'Let’s connect', wechat: 'WeChat', email: 'Email',
      footerName: '{name} · Visual Design', backTop: 'Back to top', previousWork: 'Previous work', nextWork: 'Next work', contactDialogTitle: 'Nice to meet you.', contactDialogDescription: 'Scan the QR code, or copy my WeChat ID.',
      previousSlide: 'Previous featured work', nextSlide: 'Next featured work', chooseSlide: 'Show featured work', closeWork: 'Close work details', closeContact: 'Close contact dialog', workCategories: 'Work categories',
      contactPending: 'Framework preview: WeChat details have not been added yet.', qrPending: 'WeChat QR code to be added', idPending: 'WeChat ID to be added', copyId: 'Copy WeChat ID', copied: 'WeChat ID copied', copyFailed: 'Unable to copy. Please copy this WeChat ID manually: ', emailPending: 'An email address has not been added yet.', imageFailed: 'Image unavailable. Please check the file path.', image: 'Image', placeholder: 'Temporary visual'
    }
  };
  const $ = selector => document.querySelector(selector);
  const escape = value => String(value).replace(/[&<>"']/g, character => ({ '&': '&amp;', '<': '&lt;', '>': '&gt;', '"': '&quot;', "'": '&#39;' }[character]));
  let lang = 'zh';
  try { const saved = localStorage.getItem('portfolio-language'); if (saved === 'en') lang = saved; } catch {}
  let slideIndex = 0;
  let activeWorkId = null;
  let activeCategory = content.categories[0]?.id;
  let categoryObserver;
  let toastTimer;
  const featured = content.works.filter(work => work.featured);
  const text = value => typeof value === 'string' ? value : value?.[lang] || value?.zh || '';
  const t = key => translations[lang][key];
  const categoryFor = work => content.categories.find(category => category.id === work.category);
  const reducedMotion = window.matchMedia('(prefers-reduced-motion: reduce)');
  const finePointer = window.matchMedia('(hover: hover) and (pointer: fine)');
  const revealedIds = new Set();
  const revealObserver = 'IntersectionObserver' in window ? new IntersectionObserver(entries => {
    entries.forEach(entry => {
      if (!entry.isIntersecting) return;
      entry.target.classList.add('is-visible');
      if (entry.target.dataset.work) revealedIds.add(entry.target.dataset.work);
      revealObserver.unobserve(entry.target);
    });
  }, { threshold: .05 }) : null;
  function reveal(element) {
    if (!revealObserver || reducedMotion.matches || revealedIds.has(element.dataset.work)) return;
    element.classList.add('reveal');
    revealObserver.observe(element);
  }

  function showToast(message) {
    clearTimeout(toastTimer);
    $('#toast').textContent = message;
    $('#toast').classList.add('visible');
    toastTimer = setTimeout(() => $('#toast').classList.remove('visible'), 3600);
  }
  function createImage(source, alt, eager = false) {
    const img = document.createElement('img');
    img.src = source;
    img.alt = alt;
    img.loading = eager ? 'eager' : 'lazy';
    img.decoding = 'async';
    img.addEventListener('error', () => { img.alt = t('imageFailed'); img.classList.add('image-unavailable'); });
    return img;
  }
  function renderSlide(announce = false) {
    if (!featured.length) {
      $('#slide-open').hidden = true;
      $('#slide-counter').textContent = '00 / 00';
      $('#slide-prev').disabled = true; $('#slide-next').disabled = true;
      $('#slide-title').textContent = ''; $('#slide-category').textContent = '';
      $('#hero-side').replaceChildren(); $('#slide-visual').replaceChildren(); $('#slide-dots').replaceChildren();
      return;
    }
    $('#slide-open').hidden = false;
    const work = featured[slideIndex];
    $('.hero-main').dataset.work = work.id;
    $('#slide-visual').replaceChildren(createImage(work.images[0], text(work.title), true));
    const previews = featured.length > 1 ? [1, 2].map(offset => featured[(slideIndex + offset) % featured.length]) : [work, work];
    const focusedPreviewIndex = [...$('#hero-side').children].indexOf(document.activeElement);
    $('#hero-side').replaceChildren(...previews.map(item => {
      const button = document.createElement('button');
      button.className = 'hero-preview';
      button.dataset.work = item.id;
      button.setAttribute('aria-label', `${t('viewWork')}: ${text(item.title)}`);
      button.setAttribute('aria-haspopup', 'dialog');
      button.append(createImage(item.images[0], '', true));
      const label = document.createElement('span');
      label.className = 'hero-preview-label';
      label.innerHTML = `<span>${escape(text(item.title))}</span><span aria-hidden="true">↗</span>`;
      button.append(label);
      button.addEventListener('click', () => openWork(item.id));
      return button;
    }));
    if (focusedPreviewIndex >= 0) $('#hero-side').children[focusedPreviewIndex]?.focus({ preventScroll: true });
    $('#slide-title').textContent = text(work.title);
    $('#slide-category').textContent = text(work.label);
    const number = String(slideIndex + 1).padStart(2, '0');
    $('#slide-number').textContent = number;
    $('#slide-counter').textContent = `${number} / ${String(featured.length).padStart(2, '0')}`;
    const focusedDotIndex = [...$('#slide-dots').children].indexOf(document.activeElement);
    $('#slide-dots').replaceChildren(...featured.map((item, index) => {
      const button = document.createElement('button');
      button.className = 'slide-dot';
      button.setAttribute('aria-label', `${t('chooseSlide')} ${index + 1}: ${text(item.title)}`);
      button.setAttribute('aria-current', String(index === slideIndex));
      button.addEventListener('click', () => { slideIndex = index; renderSlide(true); });
      return button;
    }));
    if (focusedDotIndex >= 0) $('#slide-dots').children[focusedDotIndex]?.focus({ preventScroll: true });
    $('#slide-prev').disabled = featured.length < 2;
    $('#slide-next').disabled = featured.length < 2;
    if (announce) $('#slide-announcement').textContent = `${number} / ${featured.length}: ${text(work.title)}`;
  }
  function changeSlide(delta) {
    if (!featured.length) return;
    slideIndex = (slideIndex + delta + featured.length) % featured.length;
    renderSlide(true);
  }
  function markCategory(id) {
    activeCategory = id;
    document.querySelectorAll('#category-nav a').forEach(link => link.setAttribute('aria-current', String(link.dataset.category === id)));
  }
  function syncCategory() {
    const sections = [...document.querySelectorAll('.work-category')];
    const current = sections.filter(section => section.getBoundingClientRect().top <= 200).pop() || sections[0];
    if (current && current.dataset.category !== activeCategory) markCategory(current.dataset.category);
  }
  function renderWorks() {
    categoryObserver?.disconnect();
    document.querySelectorAll('.work-card.reveal').forEach(card => revealObserver?.unobserve(card));
    const categories = content.categories.filter(category => content.works.some(work => work.category === category.id));
    if (!categories.some(category => category.id === activeCategory)) activeCategory = categories[0]?.id;
    $('#category-nav').replaceChildren(...categories.map(category => {
      const count = content.works.filter(work => work.category === category.id).length;
      const link = document.createElement('a');
      link.href = `#category-${category.id}`;
      link.dataset.category = category.id;
      link.innerHTML = `<span>${escape(text(category.name))}</span><span class="category-count">${String(count).padStart(2, '0')}</span>`;
      link.setAttribute('aria-current', String(activeCategory === category.id));
      link.addEventListener('click', () => markCategory(category.id));
      return link;
    }));
    $('.works-index').textContent = `INDEX / ${categories.length ? '01' : '00'}—${String(categories.length).padStart(2, '0')}`;
    $('#work-sections').replaceChildren(...categories.map((category, categoryIndex) => {
      const works = content.works.filter(work => work.category === category.id);
      const section = document.createElement('section');
      section.id = `category-${category.id}`;
      section.className = 'work-category';
      section.dataset.category = category.id;
      section.setAttribute('aria-labelledby', `category-title-${category.id}`);
      section.innerHTML = `<div class="category-heading"><span class="category-number">${String(categoryIndex + 1).padStart(2, '0')}</span><h3 id="category-title-${category.id}">${escape(text(category.name))}</h3><p>${escape(text(category.subtitle))}</p></div>`;
      const grid = document.createElement('div');
      grid.className = `work-grid${works.length === 1 ? ' single-item' : ''}`;
      works.forEach((work, index) => {
        const button = document.createElement('button');
        button.className = 'work-card';
        button.dataset.work = work.id;
        button.setAttribute('aria-haspopup', 'dialog');
        button.setAttribute('aria-label', `${t('viewWork')}: ${text(work.title)}`);
        const media = document.createElement('div');
        media.className = 'work-card-image';
        media.append(createImage(work.images[0], ''));
        const arrow = document.createElement('span');
        arrow.className = 'card-arrow'; arrow.textContent = '↗'; arrow.setAttribute('aria-hidden', 'true');
        media.append(arrow);
        const caption = document.createElement('div');
        caption.className = 'card-caption';
        caption.innerHTML = `<div><h4>${escape(text(work.title))}</h4><p>${escape(text(work.label))}</p></div><span>${String(index + 1).padStart(2, '0')}</span>`;
        if (work.type === 'project' && work.images.length > 1) {
          const spread = document.createElement('div');
          spread.className = 'project-spread';
          const detail = document.createElement('div');
          detail.className = 'project-detail';
          detail.append(createImage(work.images[1], ''));
          const label = document.createElement('span');
          label.className = 'project-detail-label'; label.textContent = t('projectDetail');
          detail.append(label); spread.append(media, detail);
          button.append(spread, caption);
        } else button.append(media, caption);
        button.addEventListener('click', () => openWork(work.id));
        grid.append(button);
      });
      section.append(grid);
      return section;
    }));
    document.querySelectorAll('.work-card').forEach(reveal);
    if ('IntersectionObserver' in window) {
      categoryObserver = new IntersectionObserver(entries => {
        if (entries.some(entry => entry.isIntersecting)) syncCategory();
      }, { rootMargin: '-90px 0px -55% 0px', threshold: 0 });
      document.querySelectorAll('.work-category').forEach(section => categoryObserver.observe(section));
    }
  }
  function renderWorkDetails() {
    const work = content.works.find(item => item.id === activeWorkId);
    if (!work) return;
    const dialog = $('#work-dialog');
    dialog.dataset.type = work.type;
    $('#work-dialog-title').textContent = text(work.title);
    $('#work-dialog-category').textContent = text(categoryFor(work)?.name);
    $('#work-dialog-description').textContent = text(work.description);
    $('#work-dialog-images').replaceChildren(...work.images.map((source, index) => {
      const figure = document.createElement('figure');
      figure.append(createImage(source, `${text(work.title)} — ${t('image')} ${index + 1}`, true));
      const caption = document.createElement('figcaption');
      caption.textContent = `${String(index + 1).padStart(2, '0')} / ${String(work.images.length).padStart(2, '0')}`;
      figure.append(caption);
      return figure;
    }));
    $('#dialog-prev').disabled = content.works.length < 2;
    $('#dialog-next').disabled = content.works.length < 2;
  }
  let dialogTrigger = null;
  function showDialog(dialog) {
    cursor.classList.remove('visible');
    dialogTrigger = document.activeElement;
    if (!dialog.open) dialog.showModal();
    document.body.classList.add('dialog-open');
  }
  function openWork(id) {
    activeWorkId = id;
    renderWorkDetails();
    showDialog($('#work-dialog'));
    $('#work-dialog').scrollTop = 0;
  }
  function changeWork(delta) {
    const index = content.works.findIndex(work => work.id === activeWorkId);
    const next = content.works[(index + delta + content.works.length) % content.works.length];
    if (next) { activeWorkId = next.id; renderWorkDetails(); $('#work-dialog').scrollTop = 0; }
  }
  function renderContact() {
    const qr = $('#wechat-qr');
    if (content.wechatQr) qr.replaceChildren(createImage(content.wechatQr, lang === 'zh' ? '微信联系二维码' : 'WeChat contact QR code', true));
    else qr.innerHTML = `<div class="qr-placeholder"><svg aria-hidden="true" xmlns="http://www.w3.org/2000/svg" viewBox="0 0 40 40" fill="none" stroke="currentColor" stroke-width="1.5"><path d="M14 3H3v11M26 3h11v11M3 26v11h11M37 26v11H26"/><rect x="10" y="10" width="7" height="7"/><rect x="23" y="10" width="7" height="7"/><rect x="10" y="23" width="7" height="7"/><path d="M23 23h7v7h-7z"/></svg><span>${escape(t('qrPending'))}</span></div>`;
    $('#copy-wechat').textContent = content.wechatId ? `${t('copyId')} · ${content.wechatId}` : t('idPending');
    $('#copy-wechat').disabled = !content.wechatId;
    $('#contact-pending').textContent = !content.wechatQr || !content.wechatId ? t('contactPending') : '';
  }
  function applyLanguage() {
    document.documentElement.lang = lang === 'zh' ? 'zh-CN' : 'en';
    document.querySelectorAll('[data-i18n]').forEach(element => {
      const value = t(element.dataset.i18n);
      if (value) element.innerHTML = value.replace('{name}', escape(text(content.name)));
    });
    document.title = `${text(content.name)} — ${lang === 'zh' ? '视觉设计作品集' : 'Visual Design Portfolio'}`;
    $('meta[name="description"]').content = lang === 'zh' ? '视觉设计作品集框架：平面海报、装帧与包装设计。' : 'Visual design portfolio framework: graphics, editorial and packaging.';
    $('#language-toggle').setAttribute('aria-label', lang === 'zh' ? 'Switch to English' : '切换到中文');
    $('.lang-zh').classList.toggle('active', lang === 'zh');
    $('.lang-en').classList.toggle('active', lang === 'en');
    $('#slide-prev').setAttribute('aria-label', t('previousSlide'));
    $('#slide-next').setAttribute('aria-label', t('nextSlide'));
    $('#slide-dots').setAttribute('aria-label', t('chooseSlide'));
    $('#category-nav').setAttribute('aria-label', t('workCategories'));
    $('[data-close-dialog="work-dialog"]').setAttribute('aria-label', t('closeWork'));
    $('[data-close-dialog="contact-dialog"]').setAttribute('aria-label', t('closeContact'));
    $('#about-tags').replaceChildren(...content.categories.map(category => { const tag = document.createElement('span'); tag.textContent = text(category.name); return tag; }));
    renderSlide(); renderWorks(); renderContact();
    if ($('#work-dialog').open) renderWorkDetails();
    cursor.innerHTML = `<span>${t('cursorView')}</span><span aria-hidden="true">↗</span>`;
  }

  $('#slide-prev').addEventListener('click', () => changeSlide(-1));
  $('#slide-next').addEventListener('click', () => changeSlide(1));
  $('#slide-open').addEventListener('click', () => { if (featured[slideIndex]) openWork(featured[slideIndex].id); });
  $('#language-toggle').addEventListener('click', () => {
    const previousScroll = window.scrollY;
    const currentSection = [...document.querySelectorAll('.work-category, #about, .contact-section')].find(section => {
      const bounds = section.getBoundingClientRect();
      return bounds.top <= 180 && bounds.bottom > 180;
    });
    const anchor = currentSection?.id ? { id: currentSection.id, top: currentSection.getBoundingClientRect().top } : null;
    lang = lang === 'zh' ? 'en' : 'zh';
    try { localStorage.setItem('portfolio-language', lang); } catch {}
    applyLanguage();
    const newSection = anchor && document.getElementById(anchor.id);
    const scrollTarget = newSection ? previousScroll + newSection.getBoundingClientRect().top - anchor.top : previousScroll;
    window.scrollTo({ top: scrollTarget, behavior: 'instant' });
  });
  document.querySelectorAll('[data-open-contact]').forEach(button => button.addEventListener('click', () => showDialog($('#contact-dialog'))));
  document.querySelectorAll('[data-close-dialog]').forEach(button => button.addEventListener('click', () => document.getElementById(button.dataset.closeDialog).close()));
  document.querySelectorAll('dialog').forEach(dialog => {
    dialog.addEventListener('close', () => {
      if (!document.querySelector('dialog[open]')) document.body.classList.remove('dialog-open');
      if (dialogTrigger?.isConnected) dialogTrigger.focus({ preventScroll: true });
    });
    dialog.addEventListener('click', event => {
      const rect = dialog.getBoundingClientRect();
      if (event.target === dialog && (event.clientX < rect.left || event.clientX > rect.right || event.clientY < rect.top || event.clientY > rect.bottom)) dialog.close();
    });
  });
  $('#dialog-prev').addEventListener('click', () => changeWork(-1));
  $('#dialog-next').addEventListener('click', () => changeWork(1));
  document.addEventListener('keydown', event => {
    if (!$('#work-dialog').open) return;
    if (event.key === 'ArrowLeft') { event.preventDefault(); changeWork(-1); }
    if (event.key === 'ArrowRight') { event.preventDefault(); changeWork(1); }
  });
  $('#email-contact').addEventListener('click', () => {
    if (content.email) window.location.href = `mailto:${encodeURIComponent(content.email)}`;
    else showToast(t('emailPending'));
  });
  $('#copy-wechat').addEventListener('click', async () => {
    if (!content.wechatId) return;
    try { await navigator.clipboard.writeText(content.wechatId); showToast(t('copied')); }
    catch { showToast(`${t('copyFailed')}${content.wechatId}`); }
  });
  let touchStart;
  $('#slider-stage').addEventListener('touchstart', event => { touchStart = { x: event.touches[0].clientX, y: event.touches[0].clientY }; }, { passive: true });
  $('#slider-stage').addEventListener('touchend', event => {
    if (!touchStart) return;
    const dx = event.changedTouches[0].clientX - touchStart.x;
    const dy = event.changedTouches[0].clientY - touchStart.y;
    if (Math.abs(dx) > 50 && Math.abs(dx) > Math.abs(dy) * 1.5) changeSlide(dx < 0 ? 1 : -1);
    touchStart = null;
  }, { passive: true });
  $('#slider-stage').addEventListener('touchcancel', () => { touchStart = null; }, { passive: true });
  let dragStart = null;
  $('#slide-visual').addEventListener('pointerdown', event => {
    if (event.pointerType !== 'mouse' || event.button !== 0) return;
    dragStart = { x: event.clientX, y: event.clientY, id: event.pointerId };
    event.currentTarget.setPointerCapture(event.pointerId);
    event.preventDefault();
  });
  $('#slide-visual').addEventListener('pointerup', event => {
    if (!dragStart || dragStart.id !== event.pointerId) return;
    const dx = event.clientX - dragStart.x;
    const dy = event.clientY - dragStart.y;
    if (Math.abs(dx) > 65 && Math.abs(dx) > Math.abs(dy) * 1.5) changeSlide(dx < 0 ? 1 : -1);
    dragStart = null;
  });
  $('#slide-visual').addEventListener('pointercancel', () => { dragStart = null; });
  $('#slide-visual').addEventListener('lostpointercapture', () => { dragStart = null; });
  $('.slider-bottom').addEventListener('keydown', event => {
    if (event.key === 'ArrowLeft') { event.preventDefault(); changeSlide(-1); }
    if (event.key === 'ArrowRight') { event.preventDefault(); changeSlide(1); }
  });
  const cursor = document.createElement('span');
  cursor.className = 'work-cursor'; cursor.setAttribute('aria-hidden', 'true');
  document.body.append(cursor);
  document.addEventListener('pointermove', event => {
    const target = event.target.closest('.work-card-image, .project-detail, .hero-preview');
    const visible = !!target && finePointer.matches && !reducedMotion.matches && !document.querySelector('dialog[open]');
    cursor.classList.toggle('visible', visible);
    if (visible) { cursor.style.left = `${event.clientX}px`; cursor.style.top = `${event.clientY}px`; }
  });
  document.addEventListener('pointerleave', () => cursor.classList.remove('visible'));
  let categoryFrame = null;
  window.addEventListener('scroll', () => {
    cursor.classList.remove('visible');
    if (categoryFrame !== null) return;
    categoryFrame = requestAnimationFrame(() => { syncCategory(); categoryFrame = null; });
  }, { passive: true });
  reducedMotion.addEventListener('change', () => {
    if (!reducedMotion.matches) return;
    cursor.classList.remove('visible');
    document.querySelectorAll('.reveal').forEach(element => { element.classList.add('is-visible'); revealObserver?.unobserve(element); });
  });
  document.addEventListener('click', event => {
    if (event.detail === 0 || event.target.closest('a, button, dialog, .slider-stage, .work-card') || reducedMotion.matches) return;
    const spark = document.createElement('span');
    spark.className = 'click-spark'; spark.setAttribute('aria-hidden', 'true');
    spark.style.left = `${event.clientX}px`; spark.style.top = `${event.clientY}px`;
    spark.innerHTML = '<svg viewBox="0 0 30 30" fill="none" stroke="currentColor" stroke-width="1.2"><path d="M15 0v30M0 15h30M4 4l22 22M4 26L26 4"/></svg>';
    document.body.append(spark); spark.addEventListener('animationend', () => spark.remove(), { once: true });
  });
  $('#copyright-year').textContent = `© ${new Date().getFullYear()}`;
  applyLanguage();
  document.querySelectorAll('.about-art, .about-content').forEach(reveal);
})();
