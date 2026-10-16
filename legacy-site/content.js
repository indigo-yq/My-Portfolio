// Add real work here. Image paths are relative to index.html, for example assets/my-poster.jpg.
// Both languages share images. Each item supports one image or a complete project.
window.portfolioContent = {
  name: { zh: '你的名字', en: 'Your Name' },
  email: '',
  wechatId: '',
  wechatQr: '',
  categories: [
    { id: 'posters', name: { zh: '平面海报', en: 'Graphic & Posters' }, subtitle: { zh: '图像与文字的对话', en: 'A dialogue of image and type' } },
    { id: 'books', name: { zh: '装帧设计', en: 'Book & Editorial' }, subtitle: { zh: '在翻阅之间，发现细节', en: 'Details discovered between pages' } },
    { id: 'packaging', name: { zh: '包装设计', en: 'Packaging' }, subtitle: { zh: '让想法拥有形状', en: 'Giving an idea its own form' } }
  ],
  works: [
    { id: 'type-study', category: 'posters', featured: true, type: 'single', title: { zh: '字形与空间', en: 'Type & Space' }, label: { zh: '海报 · 临时示意', en: 'Poster · Placeholder' }, description: { zh: '单张作品展示示意。这里将补充作品背景、设计思路，以及你在作品中的职责。', en: 'A single-image layout preview. Replace this text with the context, idea and your role in the work.' }, images: ['assets/type-study.svg'] },
    { id: 'form-study', category: 'posters', type: 'single', title: { zh: '形的练习', en: 'A Study of Form' }, label: { zh: '海报 · 临时示意', en: 'Poster · Placeholder' }, description: { zh: '这是一张用于测试排版比例的临时图形，后续替换为你的真实作品。', en: 'A temporary graphic for exploring layout proportions. Replace it with your own work.' }, images: ['assets/form-study.svg'] },
    { id: 'book-study', category: 'books', featured: true, type: 'project', title: { zh: '纸上的节奏', en: 'Rhythm on Paper' }, label: { zh: '装帧项目 · 临时示意', en: 'Editorial project · Placeholder' }, description: { zh: '多图项目展示示意。可以依次呈现封面、内页、细节和实物照片，并补充简短的项目说明。', en: 'A multi-image project preview. Show the cover, spreads, details and photographs, with a brief project description.' }, images: ['assets/book-study.svg', 'assets/book-detail.svg'] },
    { id: 'pack-study', category: 'packaging', featured: true, type: 'project', title: { zh: '物的轮廓', en: 'Objects in Form' }, label: { zh: '包装项目 · 临时示意', en: 'Packaging project · Placeholder' }, description: { zh: '包装项目展示示意。这里可以放入包装结构、视觉延展和实物展示，所有内容都可替换。', en: 'A packaging project preview. Add structural design, visual applications and product photographs. All content can be replaced.' }, images: ['assets/pack-study.svg', 'assets/pack-detail.svg'] }
  ]
};
