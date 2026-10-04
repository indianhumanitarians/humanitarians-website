import { useRef, useState } from 'react';
import type { FormEvent } from 'react';
import { Link } from 'react-router-dom';
import { getSupabaseHeaders, isSupabaseConfigured, supabaseConfig } from '../services/supabaseConfig';

type Certificate = { id: string; name: string; url: string };

export const QuizCertificates = () => {
  const [phone, setPhone] = useState('');
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState('');
  const [results, setResults] = useState<Certificate[] | null>(null);
  const requestId = useRef(0);
  const resultHeading = useRef<HTMLHeadingElement>(null);

  async function search(event: FormEvent<HTMLFormElement>) {
    event.preventDefault();
    const id = ++requestId.current;
    setError(''); setResults(null);
    if (!/^\d{10}$/.test(phone)) {
      setError('Please enter your 10-digit registered mobile number.'); return;
    }
    if (!isSupabaseConfigured) { setError('Certificate downloads are temporarily unavailable. Please try again shortly.'); return; }
    setLoading(true);
    try {
      const response = await fetch(`${supabaseConfig.url}/functions/v1/quiz-certificates`, {
        method: 'POST', headers: getSupabaseHeaders(undefined, { 'Content-Type': 'application/json' }),
        body: JSON.stringify({ phone }), signal: AbortSignal.timeout(30000), cache: 'no-store',
      });
      const data = await response.json();
      if (!response.ok) throw new Error(response.status === 429 ? 'Too many searches. Please try again in 15 minutes.' : data.error || 'Certificates are temporarily unavailable. Please try again shortly.');
      if (!Array.isArray(data.certificates)) throw new Error('Please try again shortly.');
      // Only accept download links belonging to this project’s signed Storage endpoint.
      const project = new URL(supabaseConfig.url);
      const certificates: Certificate[] = data.certificates;
      if (certificates.some(c => {
        if (typeof c.id !== 'string' || typeof c.name !== 'string' || typeof c.url !== 'string') return true;
        const url = new URL(c.url);
        return url.origin !== project.origin || !url.pathname.startsWith('/storage/v1/object/sign/quiz-certificates-2026/pdfs/');
      })) throw new Error('The download links could not be loaded. Please try again.');
      if (id !== requestId.current) return;
      setResults(certificates);
      requestAnimationFrame(() => resultHeading.current?.focus());
    } catch (cause) {
      if (id !== requestId.current) return;
      setError(cause instanceof Error && cause.name !== 'TypeError' && cause.name !== 'TimeoutError' ? cause.message : 'We could not connect. Please check your connection and try again.');
    } finally { if (id === requestId.current) setLoading(false); }
  }

  return (
    <main className="container page quiz-page">
      <div className="quiz-intro">
        <span className="quiz-eyebrow">ISLAMIC QUIZ COMPETITION FOR KIDS 2026</span>
        <h1>A little learning.<br /><em>A proud achievement.</em></h1>
        <p>Thank you for learning with us. Your participation certificate is ready to celebrate your curiosity, effort, and love of knowledge.</p>
        <span className="quiz-date">4 October 2026 <span aria-hidden="true">·</span> Team Humanitarians</span>
      </div>
      <section className="quiz-layout" aria-label="Download your participation certificate">
        <div className="quiz-form-card">
          <span className="quiz-step">YOUR MOMENT TO SHINE</span>
          <h2>Find your certificate</h2>
          <p>Enter the parent or guardian’s WhatsApp number used in the registration form.</p>
          <form onSubmit={search}>
            <label htmlFor="quiz-mobile">Registered mobile number</label>
            <input id="quiz-mobile" type="tel" inputMode="numeric" autoComplete="tel-national" value={phone} maxLength={10} pattern="[0-9]{10}"
              onChange={event => { requestId.current++; setPhone(event.target.value.replace(/\D/g, '')); setResults(null); setError(''); setLoading(false); }}
              placeholder="e.g. 9876543210" required aria-describedby="quiz-mobile-help" aria-invalid={!!error} />
            <p id="quiz-mobile-help" className="quiz-help">Enter your 10-digit mobile number.</p>
            <button className="button button-primary quiz-submit" type="submit" disabled={loading}>{loading ? 'Finding your certificates…' : 'Find my certificate'}<span aria-hidden="true">{loading ? '' : ' →'}</span></button>
          </form>
          {error && <p className="quiz-error" role="alert">{error}</p>}
          <p className="quiz-privacy">Your number is used only to find your registration. It is not displayed on the certificate.</p>
        </div>
        <div className="quiz-preview">
          <img src="/images/quiz-2026-certificate.png" alt="Humanitarians Islamic Quiz 2026 participation certificate with a navy and gold border" width="1491" height="1055" />
          <p>A keepsake for your learning journey.<br /><span>Personalized PDF · Ready to download and print</span></p>
        </div>
      </section>
      <div aria-live="polite" aria-busy={loading}>
        {results !== null && <section className="quiz-results">
          <h2 ref={resultHeading} tabIndex={-1}>{results.length ? `${results.length === 1 ? 'Your certificate is' : 'Your certificates are'} ready` : 'No registration found'}</h2>
          {results.length ? <>
            <p>Choose a student below. Download links are valid for 10 minutes; search again if a link expires.</p>
            <div className="quiz-result-list">{results.map(certificate => <article key={certificate.id} className="quiz-result">
              <div><span>Certificate of participation</span><h3 dir="auto">{certificate.name}</h3></div>
              <a className="button button-primary" href={certificate.url} target="_blank" rel="noopener noreferrer" referrerPolicy="no-referrer" aria-label={`Download certificate for ${certificate.name}`}>Download PDF <span aria-hidden="true">↓</span></a>
            </article>)}</div>
          </> : <p>Check that you entered the 10-digit WhatsApp number used when registering. If you still need help, <Link to="/contact">contact our team</Link>.</p>}
        </section>}
      </div>
      <section className="quiz-notes" aria-label="Certificate help">
        <div><h3>More than one child?</h3><p>All students registered with the same number appear together. Download a separate certificate for each child.</p></div>
        <div><h3>Printing your certificate</h3><p>Download the PDF and print on A4 paper in landscape. Choose “Fit to page” for the best result.</p></div>
        <div><h3>Need a correction?</h3><p>Names follow the registration form. <Link to="/contact">Contact Team Humanitarians</Link> if something needs correcting.</p></div>
      </section>
    </main>
  );
};
