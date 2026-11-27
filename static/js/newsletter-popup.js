import { apiService } from '../../api/api-service.js';

const T = {
    en: {
        title: '1 free play idea, every week.',
        body: 'Get a printable 30-idea building guide and weekly play ideas. No spam — unsubscribe anytime.',
        placeholder: 'Your email',
        button: 'Get my free guide',
        note: 'No spam. Unsubscribe anytime.',
        dismiss: 'Maybe later',
        success: '✓ Check your inbox to confirm.',
        error: 'Something went wrong. Please try again.',
        required: 'Please enter your email address.'
    },
    es: {
        title: '1 idea de juego gratis cada semana.',
        body: 'Recibe una guía imprimible con 30 ideas de construcción e ideas de juego semanales. Sin spam — date de baja cuando quieras.',
        placeholder: 'Tu correo electrónico',
        button: 'Quiero mi guía gratis',
        note: 'Sin spam. Date de baja cuando quieras.',
        dismiss: 'Ahora no',
        success: '✓ Revisa tu bandeja de entrada para confirmar.',
        error: 'Algo salió mal. Inténtalo de nuevo.',
        required: 'Por favor, introduce tu correo electrónico.'
    },
    ja: {
        title: '毎週1つの遊びアイデアを無料で。',
        body: '印刷できる30の組み立てアイデアガイドと毎週の遊びアイデアをお届けします。迷惑メールは送りません。',
        placeholder: 'メールアドレス',
        button: '無料ガイドを受け取る',
        note: '迷惑メールは送りません。いつでも解除できます。',
        dismiss: 'あとで',
        success: '✓ 確認のため受信トレイをご確認ください。',
        error: 'エラーが発生しました。もう一度お試しください。',
        required: 'メールアドレスを入力してください。'
    },
    'zh-Hant': {
        title: '每週一封免費玩法靈感。',
        body: '訂閱即可獲得可列印的 30 個搭建點子指南與每週玩法靈感。不發垃圾郵件，隨時可退訂。',
        placeholder: '您的電子郵件',
        button: '免費領取指南',
        note: '不發垃圾郵件，隨時可退訂。',
        dismiss: '稍後再說',
        success: '✓ 請查看收件匣確認訂閱。',
        error: '發生錯誤，請再試一次。',
        required: '請輸入您的電子郵件地址。'
    },
    de: {
        title: 'Jede Woche eine kostenlose Spielidee.',
        body: 'Erhalte einen ausdruckbaren Leitfaden mit 30 Bauideen und wöchentliche Spielideen. Kein Spam — jederzeit abbestellbar.',
        placeholder: 'Ihre E-Mail',
        button: 'Kostenlosen Leitfaden erhalten',
        note: 'Kein Spam. Jederzeit abbestellbar.',
        dismiss: 'Später',
        success: '✓ Bitte prüfen Sie Ihren Posteingang zur Bestätigung.',
        error: 'Etwas ist schiefgelaufen. Bitte versuchen Sie es erneut.',
        required: 'Bitte geben Sie Ihre E-Mail-Adresse ein.'
    },
    pt: {
        title: '1 ideia de brincadeira grátis por semana.',
        body: 'Receba um guia imprimível com 30 ideias de construção e ideias semanais de brincadeira. Sem spam — cancele quando quiser.',
        placeholder: 'Seu e-mail',
        button: 'Quero o meu guia grátis',
        note: 'Sem spam. Cancele quando quiser.',
        dismiss: 'Agora não',
        success: '✓ Verifique a sua caixa de entrada para confirmar.',
        error: 'Algo correu mal. Tente novamente.',
        required: 'Introduza o seu endereço de e-mail.'
    },
    fr: {
        title: '1 idée de jeu gratuite chaque semaine.',
        body: 'Recevez un guide imprimable de 30 idées de construction et des idées de jeu hebdomadaires. Pas de spam — désabonnement à tout moment.',
        placeholder: 'Votre email',
        button: 'Recevoir mon guide gratuit',
        note: 'Pas de spam. Désabonnement à tout moment.',
        dismiss: 'Plus tard',
        success: '✓ Vérifiez votre boîte de réception pour confirmer.',
        error: 'Une erreur est survenue. Veuillez réessayer.',
        required: 'Veuillez saisir votre adresse email.'
    }
};

const DISMISS_KEY = '_supuzz_popup_dismissed';
const SUBSCRIBED_KEY = '_supuzz_popup_subscribed';
const DISMISS_DAYS = 30;

function getLang() {
    const path = window.location.pathname || '';
    for (const dir of ['es', 'ja', 'zh-Hant', 'de', 'pt', 'fr']) {
        if (path.indexOf('/' + dir + '/') !== -1) return dir;
    }
    return 'en';
}

function isSuppressed() {
    try {
        if (localStorage.getItem(SUBSCRIBED_KEY) === '1') return true;
        const dismissed = Number(localStorage.getItem(DISMISS_KEY) || 0);
        if (dismissed && Date.now() - dismissed < DISMISS_DAYS * 24 * 60 * 60 * 1000) return true;
    } catch (e) { /* localStorage unavailable */ }
    return false;
}

function isSubscribePage() {
    const path = window.location.pathname || '';
    // Puzzle Online is a full-screen game: a popup mid-puzzle would interrupt play.
    return /(^|\/)(newsletter|privacy|puzzle)\.html$/.test(path);
}

let shown = false;
let stylesInjected = false;

function injectStyles() {
    if (stylesInjected) return;
    stylesInjected = true;
    const style = document.createElement('style');
    style.textContent = `
.newsletter-popup-overlay{position:fixed;inset:0;z-index:1000;display:flex;align-items:center;justify-content:center;padding:20px;background:rgba(28,27,31,.5);animation:newsletter-popup-fade .18s ease}
.newsletter-popup-card{position:relative;width:min(420px,100%);background:#fff;border-radius:16px;padding:28px;box-shadow:0 16px 48px rgba(0,0,0,.25);color:#1C1B1F}
.newsletter-popup-close{position:absolute;top:10px;right:12px;border:none;background:none;font-size:28px;line-height:1;cursor:pointer;color:#49454F;padding:4px}
.newsletter-popup-card h2{margin:0 24px 10px 0;font-size:1.5rem;line-height:1.2;letter-spacing:-.02em}
.newsletter-popup-body{margin:0 0 16px;color:#49454F;line-height:1.6}
.newsletter-popup-card form{display:grid;gap:10px}
.newsletter-popup-card input{box-sizing:border-box;width:100%;padding:12px 14px;border:1px solid #CAC4D0;border-radius:8px;background:#fff;color:#1C1B1F;font:inherit;font-size:1rem;line-height:1.5}
.newsletter-popup-card input::placeholder{color:#747078;opacity:1}
.newsletter-popup-card button[type="submit"]{min-height:48px;padding:12px 28px;border:none;border-radius:8px;background:#FEDD00;color:#1C1B1F;font:inherit;font-weight:600;cursor:pointer}
.newsletter-popup-card button[type="submit"]:hover{background:#E6C500}
.newsletter-popup-card button[type="submit"]:disabled{opacity:.65;cursor:wait}
.newsletter-popup-note{margin:12px 0 0;color:#49454F;font-size:.8rem;line-height:1.6}
.newsletter-popup-card #newsletterPopupMessage{margin:12px 0 0;padding:10px 12px;border-radius:8px;font-size:.9rem;line-height:1.5}
@keyframes newsletter-popup-fade{from{opacity:0}to{opacity:1}}
`;
    document.head.appendChild(style);
}

function buildModal(texts) {
    const overlay = document.createElement('div');
    overlay.className = 'newsletter-popup-overlay';
    overlay.setAttribute('role', 'dialog');
    overlay.setAttribute('aria-modal', 'true');
    overlay.setAttribute('aria-labelledby', 'newsletter-popup-title');
    overlay.innerHTML = `
        <div class="newsletter-popup-card">
            <button type="button" class="newsletter-popup-close" aria-label="${texts.dismiss}">&times;</button>
            <h2 id="newsletter-popup-title">${texts.title}</h2>
            <p class="newsletter-popup-body">${texts.body}</p>
            <form id="newsletterPopupForm">
                <input type="email" id="newsletterPopupEmail" placeholder="${texts.placeholder}" autocomplete="email" inputmode="email" required>
                <button type="submit">${texts.button}</button>
            </form>
            <p class="newsletter-popup-note">${texts.note}</p>
            <p id="newsletterPopupMessage" role="status" aria-live="polite" hidden></p>
        </div>`;
    document.body.appendChild(overlay);
    return overlay;
}

function show() {
    if (shown || isSuppressed() || isSubscribePage()) return;
    shown = true;

    injectStyles();
    const lang = getLang();
    const texts = T[lang] || T.en;
    const overlay = buildModal(texts);
    const form = overlay.querySelector('#newsletterPopupForm');
    const email = overlay.querySelector('#newsletterPopupEmail');
    const messageEl = overlay.querySelector('#newsletterPopupMessage');
    const close = overlay.querySelector('.newsletter-popup-close');
    const submitBtn = form.querySelector('button[type="submit"]');

    function hide(dismiss) {
        overlay.remove();
        try {
            if (dismiss) localStorage.setItem(DISMISS_KEY, String(Date.now()));
        } catch (e) { /* ignore */ }
    }

    overlay.addEventListener('click', (event) => { if (event.target === overlay) hide(true); });
    close.addEventListener('click', () => hide(true));
    document.addEventListener('keydown', function onKey(event) {
        if (event.key === 'Escape') { hide(true); document.removeEventListener('keydown', onKey); }
    });
    email.focus();

    form.addEventListener('submit', async (event) => {
        event.preventDefault();
        if (submitBtn.disabled) return;
        const value = email.value.trim();
        if (!value) {
            messageEl.textContent = texts.required;
            messageEl.hidden = false;
            return;
        }
        submitBtn.disabled = true;
        messageEl.hidden = true;
        try {
            await apiService.subscribe(value, { source: 'popup', language: lang });
            try { localStorage.setItem(SUBSCRIBED_KEY, '1'); } catch (e) { /* ignore */ }
            messageEl.textContent = texts.success;
            messageEl.hidden = false;
            form.reset();
            setTimeout(() => hide(false), 1800);
        } catch (error) {
            messageEl.textContent = texts.error;
            messageEl.hidden = false;
            submitBtn.disabled = false;
        }
    });
}

function initPopup() {
    if (isSubscribePage()) return;
    // Delayed trigger.
    window.setTimeout(() => { if (!shown) show(); }, 20000);
    // Scroll trigger: once past ~55% of the page.
    let scrollArmed = true;
    window.addEventListener('scroll', () => {
        if (!scrollArmed) return;
        const scrollable = document.documentElement.scrollHeight - window.innerHeight;
        if (scrollable > 0 && window.scrollY / scrollable > 0.55) {
            scrollArmed = false;
            if (!shown) show();
        }
    }, { passive: true });
    // Exit intent (desktop).
    document.addEventListener('mouseout', (event) => {
        if (!event.relatedTarget && event.clientY <= 0 && !shown) show();
    });
}

if (document.readyState === 'loading') {
    document.addEventListener('DOMContentLoaded', initPopup, { once: true });
} else {
    initPopup();
}
