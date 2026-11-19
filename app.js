// ABHITEK company profile: language switch and the four small demonstrations. No tracking, no network calls.
(() => {
  const $ = (s, el = document) => el.querySelector(s)
  const $$ = (s, el = document) => [...el.querySelectorAll(s)]
  const root = document.documentElement
  root.classList.add('js')
  const calm = matchMedia('(prefers-reduced-motion: reduce)').matches

  // ---- language: Indonesian in the markup, English in data-en ----
  let lang = 'id'
  try { lang = localStorage.getItem('abhitek.profil.lang') === 'en' ? 'en' : 'id' } catch { /* storage blocked: Indonesian */ }
  const ATTRS = ['placeholder', 'aria-label', 'alt', 'content', 'data-l']
  const renders = []
  function setLang(next) {
    lang = next
    root.lang = lang
    for (const el of $$('[data-en]')) {
      if (el.dataset.id === undefined) el.dataset.id = el.innerHTML
      el.innerHTML = lang === 'en' ? el.dataset.en : el.dataset.id
    }
    for (const a of ATTRS) for (const el of $$(`[data-en-${a}]`)) {
      const key = `id${a.replace(/(^|-)(\w)/g, (_, __, c) => c.toUpperCase())}`
      if (el.dataset[key] === undefined) el.dataset[key] = el.getAttribute(a) ?? ''
      el.setAttribute(a, lang === 'en' ? el.getAttribute(`data-en-${a}`) : el.dataset[key])
    }
    for (const b of $$('.lang button')) b.setAttribute('aria-pressed', String(b.dataset.lang === lang))
    renders.forEach((f) => f())
    try { localStorage.setItem('abhitek.profil.lang', lang) } catch { /* fine */ }
  }
  const t = (id, en) => (lang === 'en' ? en : id)
  for (const b of $$('.lang button')) b.addEventListener('click', () => setLang(b.dataset.lang))

  // ---- light and dark: the choice is kept in this browser; dark is the brand default ----
  const themeBtn = $('.theme')
  if (themeBtn) themeBtn.addEventListener('click', () => {
    const next = root.dataset.theme === 'light' ? 'dark' : 'light'
    root.dataset.theme = next
    $('meta[name="theme-color"]')?.setAttribute('content', next === 'light' ? '#FFFFFF' : '#0B0B0C')
    try { localStorage.setItem('abhitek.profil.theme', next) } catch { /* fine */ }
  })

  // ---- hero: tap the chip, the record opens (and closes on the same path) ----
  const stage = $('.stage')
  if (stage) {
    const tap = $('.tap', stage)
    let touched = false
    const set = (open) => { stage.dataset.open = String(open); tap.setAttribute('aria-expanded', String(open)) }
    tap.addEventListener('pointerdown', () => { touched = true })
    tap.addEventListener('click', () => { touched = true; set(stage.dataset.open !== 'true') })
    // Show the idea once without asking for a click; a visitor who already tapped keeps control.
    if (calm) set(true); else setTimeout(() => { if (!touched) set(true) }, 1500)
  }

  // ---- a typed number against a chip UID ----
  const sticker = $('#sticker-no'), stickerSay = $('#sticker-say'), uid = $('.uid'), uidSay = $('#uid-say')
  if (sticker) {
    const first = sticker.value
    const say = () => { stickerSay.innerHTML = sticker.value === first
      ? t('Ketik nomor lain di stiker ini.', 'Type another number on this sticker.')
      : t('<b>Nomor berubah.</b> Tidak ada catatan siapa yang menggantinya, dan alat lain bisa memakai nomor yang sama.', '<b>The number changed.</b> Nothing records who changed it, and another tool can carry the same number.') }
    sticker.addEventListener('input', say); renders.push(say)
    let tried = false
    const sayUid = () => { uidSay.innerHTML = tried
      ? t('<b>Tidak bisa.</b> UID dibaca dari chip saat ditempel. Tidak ada kolom untuk mengetik, menyalin, atau menggantinya.', '<b>Not possible.</b> The UID is read from the chip on tap. There is no field to type, copy or replace it.')
      : t('UID dibaca dari chip, bukan diketik.', 'The UID is read from the chip, not typed.') }
    $('#uid-try').addEventListener('click', () => { tried = true; sayUid(); if (!calm) { uid.classList.remove('shake'); void uid.offsetWidth; uid.classList.add('shake') } })
    renders.push(sayUid)
  }

  // ---- authenticity: three chips, three answers ----
  const AUTH = {
    fresh: { ok: true, pill: ['Diterima', 'Accepted'], title: ['Chip dikunci ke barang ini', 'The chip is locked to this item'],
      steps: [['Chip dikenali di registri ABHITEK', 'The chip is found in the ABHITEK registry'], ['Tautan ke barang ditulis, lalu dibaca ulang', 'The link to the item is written, then read back'], ['Chip dikunci permanen', 'The chip is locked for good']] },
    used: { ok: false, pill: ['Ditolak', 'Rejected'], title: ['Chip sudah terpasang di barang lain', 'The chip already belongs to another item'],
      steps: [['Chip dikenali, statusnya sudah terkunci', 'The chip is found, and it is already locked'], ['Tautan lama tetap utuh', 'The existing link stays as it is'], ['Tidak ada data baru yang dibuat', 'No new data is created']] },
    unknown: { ok: false, pill: ['Ditolak', 'Rejected'], title: ['Chip tidak ada di registri', 'The chip is not in the registry'],
      steps: [['UID tidak dikenali', 'The UID is not recognised'], ['Tidak ada data yang dibuat', 'No data is created']] },
  }
  const answer = $('#auth-answer')
  if (answer) {
    let pick = 'fresh'
    const draw = () => {
      const a = AUTH[pick]
      answer.className = `answer ${a.ok ? 'yes' : 'no'}`
      answer.innerHTML = `<p class="state"><svg width="44" height="44" aria-hidden="true"><use href="assets/icons.svg#${a.ok ? 'circle-check' : 'circle-x'}"/></svg><span><b>${t(...a.pill)}</b>${t(...a.title)}</span></p>
        <ol class="timeline">${a.steps.map((s) => `<li><span>${t(...s)}</span></li>`).join('')}</ol>`
      for (const b of $$('.chip-btn')) b.setAttribute('aria-pressed', String(b.dataset.chip === pick))
    }
    for (const b of $$('.chip-btn')) b.addEventListener('click', () => { pick = b.dataset.chip; draw() })
    renders.push(draw)
  }

  // ---- one record: each step adds lines to the same sheet ----
  const LIFE = [
    { when: ['3 Mar 2026', '3 Mar 2026'], line: ['Dibeli', 'Bought'], sub: ['Pemasok, nomor pesanan dan harga dicatat', 'Supplier, order number and price recorded'],
      say: ['Pembelian dicatat sekali: pemasok, nomor pesanan, tanggal dan harga.', 'The purchase is recorded once: supplier, order number, date and price.'] },
    { when: ['4 Mar 2026', '4 Mar 2026'], line: ['Didaftarkan dari katalog', 'Registered from the catalogue'], sub: ['Kode internal dibuat, nomor seri pabrikan disimpan terpisah', 'Internal code created, maker serial number kept apart'],
      say: ['Model dipilih dari katalog, jadi spesifikasinya tidak diketik. Kode internal dan nomor seri pabrikan adalah dua kolom yang berbeda.', 'The model comes from the catalogue, so nobody types the spec. The internal code and the maker serial number are two separate fields.'] },
    { when: ['4 Mar 2026', '4 Mar 2026'], line: ['Chip dikunci', 'Chip locked'], sub: ['Satu chip untuk satu barang, selamanya', 'One chip for one item, for good'],
      say: ['Chip ditempel dan dikunci ke barang ini. Chip tidak bisa dilepas atau dipakai ulang; kalau rusak, chip diganti dan UID lama masuk daftar hitam.', 'The chip is fitted and locked to this item. It cannot be removed or reused; a damaged chip is replaced and the old UID goes on the block list.'] },
    { when: ['10 Mar 2026', '10 Mar 2026'], line: ['Diserahkan ke Andi Pratama', 'Handed to Andi Pratama'], sub: ['Penerima mengonfirmasi dengan tempel chip atau kode', 'The receiver confirms by tapping the chip or with a code'],
      say: ['Serah-terima punya dua sisi: yang menyerahkan dan yang menerima. Alat baru tercatat dipegang setelah penerima mengonfirmasi.', 'A handover has two sides: the giver and the receiver. The tool counts as held only after the receiver confirms.'] },
    { when: ['2 Nov 2026', '2 Nov 2026'], line: ['Diinspeksi: lulus', 'Inspected: passed'], sub: ['Checklist diisi di ponsel, di depan alatnya', 'Checklist filled on the phone, in front of the tool'],
      say: ['Inspektur menempelkan ponsel ke chip, lalu mengisi checklist untuk model itu. Hasilnya masuk ke rekam yang sama.', 'The inspector taps the phone on the chip, then fills the checklist for that model. The result goes into the same record.'] },
    { when: ['9 Nov 2026', '9 Nov 2026'], line: ['Perbaikan selesai', 'Repair done'], sub: ['Kerusakan dilaporkan, lalu diperbaiki', 'Damage reported, then repaired'],
      say: ['Kerusakan dilaporkan dari ponsel. Alat ditahan dan tidak bisa diserahkan ke siapa pun sampai perbaikannya selesai.', 'Damage is reported from the phone. The tool is held back and cannot be handed to anyone until the repair is done.'] },
    { when: ['Nanti', 'Later'], line: ['Dilepas', 'Disposed'], sub: ['Dengan persetujuan berjenjang', 'With tiered approval'],
      say: ['Alat dilepas hanya setelah disetujui orang kedua. Rekamnya tetap tersimpan sebagai bukti.', 'A tool is disposed only after a second person approves. Its record stays as evidence.'] },
  ]
  const lifeList = $('#life-list')
  if (lifeList) {
    let at = 3
    const btns = $$('.steps button')
    const draw = () => {
      lifeList.innerHTML = LIFE.map((s, i) => `<li class="${i > at ? 'off next' : ''}"><span>${t(...s.line)}<small>${t(...s.sub)}</small></span><time>${t(...s.when)}</time></li>`).join('')
      $('#life-say').textContent = t(...LIFE[at].say)
      btns.forEach((b, i) => { b.setAttribute('aria-selected', String(i === at)); b.tabIndex = i === at ? 0 : -1 })
    }
    btns.forEach((b, i) => {
      b.addEventListener('click', () => { at = i; draw() })
      b.addEventListener('keydown', (e) => {
        const d = { ArrowDown: 1, ArrowRight: 1, ArrowUp: -1, ArrowLeft: -1 }[e.key]
        if (!d) return
        e.preventDefault(); at = (at + d + LIFE.length) % LIFE.length; draw(); btns[at].focus()
      })
    })
    renders.push(draw)
  }

  // ---- catalogue: real models from the ABHITEK catalogue; picking one fills the form ----
  const CAT = {
    harness: { label: ['Harness', 'Harness'], code: 'ORG1-APD-0452', models: [
      ['Petzl', 'AVAO (European version)', 'EN 361, EN 358, EN 813'], ['CMC', 'ATOM Rescue Harness', 'ANSI Z359.11'], ['Skylotec', 'RESC B-HARNESS', 'EN 1497, EN 1498']] },
    helmet: { label: ['Helm', 'Helmet'], code: 'ORG1-APD-0453', models: [
      ['Kask', 'Zenith X2', 'ANSI Z89.1, EN 12492'], ['MSA', 'V-Gard Cap Style', 'EN 397, ANSI Z89.1 Type I, CSA Z94.1'], ['Rothoblaas', 'POP construction helmet', 'EN 397']] },
    connector: { label: ['Karabiner', 'Carabiner'], code: 'ORG1-APD-0454', models: [
      ['Climbing Technology', 'PILLAR WG', 'EN 12275, EN 362'], ['Rock Exotica', 'rockD ANSI Stainless', 'ANSI Z359.12'], ['Kong', 'Aluminium carabiner, automatic locking sleeve', 'EN 12275, EN 362']] },
    descender: { label: ['Descender', 'Descender'], code: 'ORG1-APD-0455', models: [
      ['Petzl', 'RIG', 'EN 12841, EN 341, EN 15151-1, ANSI Z359.9'], ['Petzl', 'I’D S', 'EN 12841, EN 341, EN 15151-1, ANSI Z359.9'], ['Kong', 'Thorig', 'EN 17961']] },
    rope: { label: ['Tali', 'Rope'], code: 'ORG1-APD-0456', models: [
      ['Edelrid', 'PROSTATIC SYNCTEC 11.0 mm', 'EN 1891'], ['Petzl', 'BEAM 11 mm', 'ANSI Z359.15'], ['CMC', 'Aztek ProSeries Cord', 'EN 564']] },
  }
  const types = $('#cat-types'), models = $('#cat-models')
  if (types) {
    let type = 'harness', chosen = -1
    const out = (k) => $(`#f-${k}`)
    const fill = () => {
      const m = CAT[type].models[chosen]
      const vals = m ? { brand: m[0], model: m[1], std: m[2], code: CAT[type].code } : { brand: '', model: '', std: '', code: '' }
      Object.entries(vals).forEach(([k, v], i) => {
        const el = out(k)
        const put = () => { el.textContent = v; el.classList.toggle('filled', !!v); if (v) setTimeout(() => el.classList.remove('filled'), 900) }
        if (calm || !v) put(); else setTimeout(put, 70 * i)
      })
    }
    const draw = () => {
      types.innerHTML = Object.entries(CAT).map(([k, v]) => `<button type="button" data-type="${k}" aria-pressed="${k === type}">${t(...v.label)}</button>`).join('')
      models.innerHTML = CAT[type].models.map((m, i) => `<button type="button" data-i="${i}" aria-pressed="${i === chosen}"><span>${m[0]}</span><b>${m[1]}</b></button>`).join('')
      for (const o of $$('.form output')) o.dataset.empty = t('Terisi setelah model dipilih', 'Fills when a model is picked')
    }
    types.addEventListener('click', (e) => { const b = e.target.closest('button'); if (!b) return; type = b.dataset.type; chosen = -1; draw(); fill() })
    models.addEventListener('click', (e) => { const b = e.target.closest('button'); if (!b) return; chosen = Number(b.dataset.i); draw(); fill() })
    renders.push(draw)
    // Show one filled form on arrival, so the point is made without a click.
    const io = new IntersectionObserver((es) => { if (es.some((x) => x.isIntersecting) && chosen < 0) { chosen = 0; draw(); fill(); io.disconnect() } }, { threshold: 0.4 })
    io.observe(models)
  }

  // ---- the app: real screens ----
  const shotImg = $('#app-shot')
  if (shotImg) {
    const tabs = $$('.app .tabs button')
    for (const b of tabs) b.addEventListener('click', () => {
      tabs.forEach((x) => x.setAttribute('aria-selected', String(x === b)))
      shotImg.style.opacity = '0'
      const next = new Image()
      next.onload = () => { shotImg.src = next.src; shotImg.alt = b.dataset[lang === 'en' ? 'altEn' : 'alt']; shotImg.style.opacity = '1' }
      next.src = b.dataset.src
    })
  }

  // ---- pilot request: opens the visitor's own mail app, or copies the text; nothing is sent from this page ----
  const form = $('#pilot-form')
  if (form) {
    const text = () => {
      const f = new FormData(form)
      return [
        [t('Nama', 'Name'), f.get('nama')], [t('Organisasi', 'Organisation'), f.get('org')], [t('Kontak', 'Contact'), f.get('kontak')],
        [t('Jumlah alat', 'Number of tools'), f.get('jumlah')], [t('Catatan', 'Note'), f.get('catatan')],
      ].filter(([, v]) => v).map(([k, v]) => `${k}: ${v}`).join('\n')
    }
    const subject = () => t('Permintaan Paket Pilot ABHITEK', 'ABHITEK Pilot Pack request')
    form.addEventListener('submit', (e) => {
      e.preventDefault()
      $('#pilot-text').textContent = text(); $('#pilot-sent').hidden = false
      location.href = `mailto:${form.dataset.to}?subject=${encodeURIComponent(subject())}&body=${encodeURIComponent(text())}`
    })
    $('#pilot-copy').addEventListener('click', async () => {
      if (!form.reportValidity()) return
      const note = $('#pilot-note')
      try {
        await navigator.clipboard.writeText(`${subject()}\n${t('Kepada', 'To')}: ${form.dataset.to}\n\n${text()}`)
        note.textContent = t('Tersalin. Tempel di email atau WhatsApp, lalu kirim ke ' + form.dataset.to + '.', 'Copied. Paste it into an email or a chat and send it to ' + form.dataset.to + '.')
      } catch {
        note.textContent = t('Browser ini tidak mengizinkan salin otomatis. Pakai tombol email.', 'This browser does not allow copying. Use the email button.')
      }
    })
  }

  // ---- phone: the request bar stays at the bottom until the form itself is on screen ----
  const sticky = $('.sticky'), pilot = $('#pilot') ?? $('.cta-band'), hero = $('.hero .cta')
  if (sticky && pilot) {
    const seen = new Set()
    const io = new IntersectionObserver((es) => { for (const x of es) x.isIntersecting ? seen.add(x.target) : seen.delete(x.target); sticky.classList.toggle('on', seen.size === 0) })
    io.observe(pilot); if (hero) io.observe(hero)
  }
  for (const a of $$('.menu a')) a.addEventListener('click', () => a.closest('details').removeAttribute('open'))

  // ---- brand rails: a second copy of each list makes the loop seamless; a button, hover or focus pauses them ----
  const rails = [...document.querySelectorAll('[data-rail]')]
  for (const rail of rails) {
    const list = rail.querySelector('.railtrack'), belt = document.createElement('div'), twin = list.cloneNode(true)
    belt.className = 'belt'; twin.setAttribute('aria-hidden', 'true')
    for (const img of twin.querySelectorAll('img')) img.alt = ''
    for (const li of twin.querySelectorAll('li')) li.removeAttribute('tabindex')
    rail.append(belt); belt.append(list, twin)
  }
  const pauseBtn = document.querySelector('.railpause')
  if (pauseBtn) pauseBtn.addEventListener('click', () => { const on = pauseBtn.getAttribute('aria-pressed') !== 'true'; pauseBtn.setAttribute('aria-pressed', String(on)); for (const r of rails) r.dataset.paused = String(on) })

  // ---- two audiences: one banner is chosen, its panel shows ----
  const audTabs = [...document.querySelectorAll('.audtab')]
  for (const tab of audTabs) tab.addEventListener('click', () => {
    for (const x of audTabs) { const on = x === tab; x.setAttribute('aria-selected', String(on)); document.getElementById(x.getAttribute('aria-controls')).hidden = !on }
  })

  // ---- the demo follows the device: a phone opens the field app, a computer opens the desk dashboard ----
  const onPhone = matchMedia('(max-width: 760px)').matches || (matchMedia('(pointer: coarse)').matches && matchMedia('(max-width: 1024px)').matches)
  if (onPhone) for (const a of document.querySelectorAll('a[href$="/abhitek/app/"]')) a.href = a.href + 'lapangan/'

  // ---- catalogue finder: every model of the main catalogue, filtered in the browser (assets/katalog.json) ----
  const finderEl = document.querySelector('[data-finder]')
  if (finderEl) {
    const KINDS = [['', 'Semua', 'All'], ['harness', 'Harness', 'Harnesses'], ['helm', 'Helm', 'Helmets'], ['konektor', 'Karabiner & konektor', 'Carabiners & connectors'], ['descender', 'Descender & ascender', 'Descenders & ascenders'],
      ['tali', 'Tali', 'Rope'], ['lanyard', 'Lanyard', 'Lanyards'], ['anchor', 'Anchor & sling', 'Anchors & slings'], ['pulley', 'Pulley', 'Pulleys'], ['penahan-jatuh', 'Penahan jatuh', 'Fall arresters'], ['peredam', 'Peredam', 'Absorbers'], ['rescue', 'Rescue', 'Rescue']]
    const OFFICE_KINDS = [['laptop', 'Laptop', 'Laptops'], ['desktop', 'Desktop', 'Desktops'], ['monitor', 'Monitor', 'Monitors'], ['ponsel', 'Ponsel', 'Phones'], ['tablet', 'Tablet', 'Tablets'], ['printer', 'Printer', 'Printers'],
      ['pemindai', 'Pemindai', 'Scanners'], ['proyektor', 'Proyektor', 'Projectors'], ['periferal', 'Periferal', 'Peripherals'], ['kursi', 'Kursi', 'Chairs'], ['meja', 'Meja', 'Desks'], ['lemari', 'Lemari', 'Cabinets']]
    const q = document.querySelector('#fq'), brand = document.querySelector('#fb'), chips = document.querySelector('#ft'), out = document.querySelector('#fr'), count = document.querySelector('#fc'), moreBtn = document.querySelector('#fm')
    const params = new URLSearchParams(location.search)
    let rows = [], kind = [...KINDS, ...OFFICE_KINDS].some((k) => k[0] === params.get('jenis')) ? params.get('jenis') : '', shown = 24
    q.value = params.get('q') ?? ''
    const esc = (s) => s.replace(/[&<>"]/g, (c) => ({ '&': '&amp;', '<': '&lt;', '>': '&gt;', '"': '&quot;' }[c]))
    const label = (k) => { const x = [...KINDS, ...OFFICE_KINDS].find((y) => y[0] === k); return x ? t(x[1], x[2]) : t('Lainnya', 'Other') }
    const draw = () => {
      const chip = ([k, id, en]) => `<button class="chipbtn" type="button" data-k="${k}" aria-pressed="${k === kind}">${t(id, en)}</button>`
      chips.innerHTML = `<span class="lbl">${t('Alat keselamatan', 'Safety equipment')}</span>${KINDS.map(chip).join('')}<span class="brk"></span><span class="lbl">${t('Alat kantor', 'Office equipment')}</span>${OFFICE_KINDS.map(chip).join('')}`
      if (!rows.length) { count.textContent = t('Memuat katalog...', 'Loading the catalogue...'); return }
      const words = q.value.toLowerCase().split(/\s+/).filter(Boolean)
      const hit = rows.filter((r) => (!kind || r[3] === kind) && (!brand.value || r[0] === brand.value) && words.every((w) => (r[0] + ' ' + r[1] + ' ' + r[2]).toLowerCase().includes(w)))
      const n = hit.length.toLocaleString(lang === 'en' ? 'en-GB' : 'id-ID'), all = rows.length.toLocaleString(lang === 'en' ? 'en-GB' : 'id-ID')
      count.innerHTML = hit.length ? t(`<b>${n}</b> model cocok, dari ${all} model di katalog.`, `<b>${n}</b> matching models, out of ${all} in the catalogue.`)
        : t('Tidak ada model yang cocok. Coba kata lain, atau tambahkan model itu sendiri saat mendaftarkan alat.', 'No model matches. Try another word, or add that model yourself when you register the tool.')
      out.innerHTML = hit.slice(0, shown).map((r) => `<article class="model"><p class="b"><span>${esc(r[0])}</span><em>${r[3] === 'lain' ? '' : label(r[3])}</em></p><h3>${esc(r[1])}</h3><p class="std">${r[2] ? r[2].split(', ').slice(0, 3).map((x) => `<span>${esc(x)}</span>`).join('') : ''}</p></article>`).join('')
      moreBtn.hidden = hit.length <= shown
    }
    chips.addEventListener('click', (e) => { const b = e.target.closest('button'); if (!b) return; kind = b.dataset.k; shown = 24; draw() })
    q.addEventListener('input', () => { shown = 24; draw() })
    brand.addEventListener('change', () => { shown = 24; draw() })
    moreBtn.addEventListener('click', () => { shown += 24; draw() })
    renders.push(draw)
    fetch('assets/katalog.json').then((r) => r.json()).then((d) => {
      rows = d.baris
      const names = [...new Set(rows.map((r) => r[0]))].filter(Boolean).sort((a, b) => a.localeCompare(b))
      brand.insertAdjacentHTML('beforeend', names.map((n) => `<option>${esc(n)}</option>`).join(''))
      draw()
    }).catch(() => { count.textContent = t('Katalog belum bisa dimuat. Muat ulang halaman ini.', 'The catalogue could not load. Reload this page.') })
  }

  // ---- quiet arrival of sections ----
  const reveal = new IntersectionObserver((es) => { for (const x of es) if (x.isIntersecting) { x.target.classList.add('in'); reveal.unobserve(x.target) } }, { rootMargin: '0px 0px -10% 0px' })
  for (const el of $$('.reveal')) reveal.observe(el)

  setLang(lang)
})()
