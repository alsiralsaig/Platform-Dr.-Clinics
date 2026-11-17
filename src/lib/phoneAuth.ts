import type { Auth } from 'firebase/auth';
import {
  signInWithEmailAndPassword,
  createUserWithEmailAndPassword,
  updateProfile,
  sendEmailVerification,
} from 'firebase/auth';

/**
 * تسجيل الدخول بالهاتف أو البريد + كلمة السر — نافذة مبنية بـ DOM مباشرة،
 * لا تحتاج أي تعديل في مكوّنات React.
 * السبب: نافذة Google المنبثقة لا تعمل داخل WebView.
 */
/** النطاق الداخلي الذي تُحوَّل إليه أرقام الهواتف (لا يُرسل إليه أي بريد). */
const PHONE_DOMAIN = 'phone.drclinics.app';

const AR_DIGITS: Record<string, string> = {
  '٠': '0', '١': '1', '٢': '2', '٣': '3', '٤': '4', '٥': '5', '٦': '6', '٧': '7', '٨': '8', '٩': '9',
  '۰': '0', '۱': '1', '۲': '2', '۳': '3', '۴': '4', '۵': '5', '۶': '6', '۷': '7', '۸': '8', '۹': '9',
};

/** يوحّد رقم الهاتف بصيغة دولية +249xxxxxxxxx ويقبل الأرقام العربية. */
export function normalizePhone(raw: string): string | null {
  if (typeof raw !== 'string') return null;
  let s = raw
    .replace(/[٠-٩۰-۹]/g, (d) => AR_DIGITS[d] || d)
    .replace(/[\s\-().\u200e\u200f]/g, '');
  if (!s) return null;
  if (s.startsWith('00')) s = '+' + s.slice(2);
  if (s.startsWith('+')) {
    s = '+' + s.slice(1).replace(/\D/g, '');
  } else {
    s = s.replace(/\D/g, '');
    if (s.startsWith('249')) s = '+' + s;
    else if (s.startsWith('0') && s.length === 10) s = '+249' + s.slice(1);
    else if (s.length === 9 && /^[19]/.test(s)) s = '+249' + s;
    else return null;
  }
  if (s.startsWith('+249')) return /^\+249[19]\d{8}$/.test(s) ? s : null;
  return /^\+[1-9]\d{7,14}$/.test(s) ? s : null;
}

/** يحوّل ما يكتبه المستخدم إلى بريد داخلي: رقم هاتف → بريد ثابت، أو بريد كما هو. */
export function identifierToEmail(raw: string): { email: string; isPhone: boolean } | null {
  const v = (raw || '').trim();
  if (!v) return null;
  if (v.includes('@')) {
    const email = v.toLowerCase();
    return /^[^\s@]+@[^\s@]+\.[^\s@]{2,}$/.test(email) ? { email, isPhone: false } : null;
  }
  const phone = normalizePhone(v);
  if (!phone) return null;
  return { email: phone + '@' + PHONE_DOMAIN, isPhone: true };
}

function arabicError(code: string): string {
  switch (code) {
    case 'auth/operation-not-allowed':
      return 'تسجيل الدخول بالبريد/كلمة السر غير مُفعّل في Firebase. فعّله من: Firebase Console ← Authentication ← Sign-in method ← Email/Password.';
    case 'auth/invalid-credential':
    case 'auth/wrong-password':
    case 'auth/user-not-found':
      return 'الرقم أو كلمة السر غير صحيحة.';
    case 'auth/invalid-email':
      return 'الرقم أو البريد غير صحيح.';
    case 'auth/email-already-in-use':
      return 'هذا الحساب مسجّل مسبقًا — استخدم «دخول» بدل «حساب جديد».';
    case 'auth/weak-password':
      return 'كلمة السر قصيرة: 6 أحرف أو أرقام على الأقل.';
    case 'auth/network-request-failed':
      return 'لا يوجد اتصال بالإنترنت — تحقّق من الشبكة.';
    case 'auth/too-many-requests':
      return 'محاولات كثيرة. انتظر دقيقة ثم أعد المحاولة.';
    case 'auth/missing-password':
      return 'اكتب كلمة السر.';
    default:
      return 'تعذّر إتمام العملية. رمز الخطأ: ' + code;
  }
}

function el<K extends keyof HTMLElementTagNameMap>(
  tag: K,
  style: Partial<CSSStyleDeclaration> = {},
  props: Record<string, string> = {}
): HTMLElementTagNameMap[K] {
  const node = document.createElement(tag);
  Object.assign(node.style, style);
  Object.entries(props).forEach(([k, v]) => node.setAttribute(k, v));
  return node;
}

let overlayOpen = false;

/** نافذة الدخول — تُبنى بـ DOM مباشرة حتى لا تحتاج أي تعديل في مكوّنات React. */
export function openPhoneLogin(auth: Auth): Promise<void> {
  return new Promise<void>((resolve, reject) => {
    if (overlayOpen) {
      reject(new Error('نافذة الدخول مفتوحة بالفعل.'));
      return;
    }
    overlayOpen = true;

    const NAVY = '#071a2b';
    const CARD = '#0e2438';
    const LINE = '#1e3a52';
    const TEAL = '#1fbba6';
    const TEXT = '#eaf2f8';
    const MUTED = '#8fa9bd';

    const back = el('div', {
      position: 'fixed', inset: '0', zIndex: '2147483000',
      background: 'rgba(3,10,18,0.86)', display: 'flex',
      alignItems: 'center', justifyContent: 'center', padding: '16px',
      direction: 'rtl', fontFamily: 'inherit',
    });
    back.setAttribute('dir', 'rtl');

    const card = el('div', {
      width: '100%', maxWidth: '420px', background: CARD, color: TEXT,
      borderRadius: '18px', padding: '20px', boxSizing: 'border-box',
      border: '1px solid ' + LINE, boxShadow: '0 24px 60px rgba(0,0,0,0.55)',
      maxHeight: '92vh', overflowY: 'auto',
    });

    const title = el('div', {
      fontSize: '20px', fontWeight: '700', marginBottom: '4px', textAlign: 'center',
    });
    title.textContent = 'تسجيل الدخول';

    const subtitle = el('div', {
      fontSize: '13px', color: MUTED, textAlign: 'center', marginBottom: '16px',
      lineHeight: '1.6',
    });
    subtitle.textContent = 'بالهاتف أو البريد الإلكتروني وكلمة السر';

    const nameWrap = el('div', { display: 'none', marginBottom: '10px' });
    const nameInput = el('input', {
      width: '100%', boxSizing: 'border-box', padding: '13px 14px', fontSize: '15px',
      borderRadius: '12px', border: '1px solid ' + LINE, background: NAVY,
      color: TEXT, outline: 'none', direction: 'rtl',
    }, { placeholder: 'الاسم الكامل', type: 'text', autocomplete: 'name' });
    nameWrap.appendChild(nameInput);

    const idInput = el('input', {
      width: '100%', boxSizing: 'border-box', padding: '13px 14px', fontSize: '15px',
      borderRadius: '12px', border: '1px solid ' + LINE, background: NAVY,
      color: TEXT, outline: 'none', direction: 'rtl', marginBottom: '10px',
    }, {
      placeholder: 'رقم الهاتف أو البريد', type: 'text',
      autocomplete: 'username', inputmode: 'tel', dir: 'rtl',
    });

    const pwInput = el('input', {
      width: '100%', boxSizing: 'border-box', padding: '13px 14px', fontSize: '15px',
      borderRadius: '12px', border: '1px solid ' + LINE, background: NAVY,
      color: TEXT, outline: 'none', direction: 'rtl', marginBottom: '6px',
    }, { placeholder: 'كلمة السر', type: 'password', autocomplete: 'current-password' });

    const hint = el('div', { fontSize: '12px', color: MUTED, marginBottom: '12px', minHeight: '16px' });
    hint.textContent = 'مثال الرقم: 0912345678';

    const errorBox = el('div', {
      display: 'none', background: 'rgba(220,60,60,0.12)', border: '1px solid rgba(220,60,60,0.45)',
      color: '#ffb4b4', padding: '10px 12px', borderRadius: '10px', fontSize: '13px',
      lineHeight: '1.7', marginBottom: '12px',
    });

    const submit = el('button', {
      width: '100%', padding: '14px', fontSize: '16px', fontWeight: '700',
      borderRadius: '12px', border: 'none', background: TEAL, color: '#04222c',
      cursor: 'pointer',
    });
    submit.textContent = 'دخول';

    const toggle = el('button', {
      width: '100%', marginTop: '10px', padding: '12px', fontSize: '14px',
      borderRadius: '12px', border: '1px solid ' + LINE, background: 'transparent',
      color: TEAL, cursor: 'pointer',
    });
    toggle.textContent = 'ليس لدي حساب — إنشاء حساب جديد';

    const cancel = el('button', {
      width: '100%', marginTop: '8px', padding: '10px', fontSize: '13px',
      borderRadius: '12px', border: 'none', background: 'transparent', color: MUTED,
      cursor: 'pointer',
    });
    cancel.textContent = 'إلغاء';

    card.append(title, subtitle, nameWrap, idInput, pwInput, hint, errorBox, submit, toggle, cancel);
    back.appendChild(card);
    document.body.appendChild(back);
    setTimeout(() => idInput.focus(), 60);

    let mode: 'signin' | 'signup' = 'signin';
    let busy = false;

    const setMode = (next: 'signin' | 'signup') => {
      mode = next;
      title.textContent = next === 'signin' ? 'تسجيل الدخول' : 'إنشاء حساب جديد';
      submit.textContent = next === 'signin' ? 'دخول' : 'إنشاء الحساب';
      toggle.textContent = next === 'signin' ? 'ليس لدي حساب — إنشاء حساب جديد' : 'لدي حساب — رجوع إلى الدخول';
      nameWrap.style.display = next === 'signup' ? 'block' : 'none';
      hint.textContent = next === 'signin'
        ? 'مثال الرقم: 0912345678'
        : 'كلمة السر 6 أحرف أو أرقام على الأقل';
      pwInput.setAttribute('autocomplete', next === 'signin' ? 'current-password' : 'new-password');
      errorBox.style.display = 'none';
    };

    const fail = (msg: string) => {
      errorBox.textContent = msg;
      errorBox.style.display = 'block';
    };

    const finish = () => {
      overlayOpen = false;
      if (back.parentNode) back.parentNode.removeChild(back);
      resolve();
    };

    const close = (err?: Error) => {
      overlayOpen = false;
      if (back.parentNode) back.parentNode.removeChild(back);
      if (err) reject(err);
    };

    toggle.onclick = () => setMode(mode === 'signin' ? 'signup' : 'signin');
    cancel.onclick = () => close(new Error('أُلغي تسجيل الدخول.'));

    const run = async () => {
      if (busy) return;
      errorBox.style.display = 'none';
      const ident = identifierToEmail(idInput.value);
      const pw = pwInput.value;
      if (!ident) {
        fail('اكتب رقم هاتف سوداني صحيح (مثل 0912345678) أو بريدًا إلكترونيًا صحيحًا.');
        return;
      }
      if (!pw || pw.length < 6) {
        fail('كلمة السر 6 أحرف أو أرقام على الأقل.');
        return;
      }
      if (mode === 'signup' && nameInput.value.trim().length < 2) {
        fail('اكتب الاسم الكامل.');
        return;
      }
      busy = true;
      submit.textContent = 'جارٍ…';
      try {
        if (mode === 'signin') {
          await signInWithEmailAndPassword(auth, ident.email, pw);
        } else {
          const cred = await createUserWithEmailAndPassword(auth, ident.email, pw);
          const displayName = nameInput.value.trim();
          if (cred.user) {
            try { await updateProfile(cred.user, { displayName }); } catch { /* اختياري */ }
            if (!ident.isPhone) {
              try { await sendEmailVerification(cred.user); } catch { /* اختياري */ }
            }
          }
        }
        finish();
      } catch (e) {
        const code = (e as { code?: string })?.code || '';
        fail(arabicError(code));
        submit.textContent = mode === 'signin' ? 'دخول' : 'إنشاء الحساب';
        busy = false;
      }
    };

    submit.onclick = () => { void run(); };
    [idInput, pwInput, nameInput].forEach((input) => {
      input.addEventListener('keydown', (ev) => {
        if ((ev as KeyboardEvent).key === 'Enter') { ev.preventDefault(); void run(); }
      });
    });

    // إغلاق بالضغط على الخلفية خارج البطاقة
    back.addEventListener('click', (ev) => {
      if (ev.target === back) close(new Error('أُلغي تسجيل الدخول.'));
    });
  });
}

