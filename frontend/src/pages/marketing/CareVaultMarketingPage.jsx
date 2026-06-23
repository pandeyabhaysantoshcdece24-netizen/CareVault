import { Suspense, lazy, useEffect, useRef } from 'react';
import { Link } from 'react-router-dom';
import { useGSAP } from '@gsap/react';
import gsap from 'gsap';
import Lenis from 'lenis';
import { ScrollTrigger } from 'gsap/ScrollTrigger';
import { SplitText } from 'gsap/SplitText';
import '../../styles/marketing.css';

gsap.registerPlugin(ScrollTrigger, SplitText);

const MarketingBelowFold = lazy(() => import('./MarketingBelowFold'));

const MARQUEE_COPY =
  'CareVault  ✦  Secure Records  ✦  OCR Scanning  ✦  Doctor Access  ✦  Prescription Tracking  ✦  ';

function CareVaultMarketingPage() {
  const pageRef = useRef(null);

  useEffect(() => {
    let mounted = true;

    // Warm up the lazy chunk early so the transition after section 4 never appears empty.
    import('./MarketingBelowFold');

    if (document?.fonts?.ready) {
      document.fonts.ready.then(() => {
        if (mounted) {
          ScrollTrigger.refresh();
        }
      });
    }

    return () => {
      mounted = false;
    };
  }, []);

  useGSAP(
    (context) => {
      try {
      const q = typeof context.selector === 'function'
        ? context.selector
        : (sel) => Array.from(document.querySelectorAll(sel));
      const splitInstances = [];
      const previousDefaults = ScrollTrigger.defaults();

      ScrollTrigger.defaults({
        start: 'top 80%',
        toggleActions: 'play none none none',
      });

      const preloader = q('.mk-preloader')[0];
      const counter = q('.mk-preloader-count')[0];
      const topPanel = q('.mk-preloader-top')[0];
      const bottomPanel = q('.mk-preloader-bottom')[0];

      const eyebrow = q('.mk-hero-eyebrow')[0];
      const h1Lines = q('.mk-hero-line-text');
      const subtext = q('.mk-hero-sub')[0];
      const ctas = q('.mk-hero-actions .mk-cta');
      const statsRow = q('.mk-hero-stats')[0];

      const cursor = q('.mk-cursor')[0];
      const marqueeSection = q('.mk-marquee')[0];
      const marqueeTrack = q('.mk-marquee-track')[0];

      const statementSection = q('.mk-problem')[0];
      const statement = q('.mk-problem-statement')[0];
      const statementTag = q('.mk-problem-tag')[0];
      const problemScrollRange = '+=130%';

      const lenis = new Lenis({ lerp: 0.08, smoothWheel: true });
      const raf = (time) => lenis.raf(time * 1000);
      gsap.ticker.add(raf);
      gsap.ticker.lagSmoothing(0);

      const heroTl = gsap.timeline({ paused: true, delay: 0.2 });

      const eyebrowSplit = new SplitText(eyebrow, { type: 'chars' });
      const subSplit = new SplitText(subtext, { type: 'chars' });
      splitInstances.push(eyebrowSplit, subSplit);

      heroTl
        .from(eyebrowSplit.chars, {
          opacity: 0,
          y: 20,
          duration: 0.55,
          stagger: 0.015,
          ease: 'power3.out',
        })
        .from(
          h1Lines,
          {
            yPercent: 110,
            duration: 0.9,
            ease: 'power4.out',
            stagger: 0.12,
            onStart: () => gsap.set(h1Lines, { willChange: 'transform' }),
            onComplete: () => gsap.set(h1Lines, { clearProps: 'willChange' }),
          },
          '-=0.25'
        )
        .from(
          subSplit.chars,
          {
            opacity: 0,
            y: 26,
            duration: 0.45,
            ease: 'power3.out',
            stagger: 0.009,
          },
          '-=0.45'
        )
        .from(
          ctas,
          {
            opacity: 0,
            y: 20,
            duration: 0.5,
            stagger: 0.1,
            ease: 'power2.out',
          },
          '-=0.28'
        )
        .from(
          statsRow,
          {
            opacity: 0,
            y: 20,
            duration: 0.6,
            ease: 'power2.out',
          },
          '-=0.35'
        );

      const countProxy = { value: 0 };
      const preloaderTl = gsap.timeline();
      preloaderTl
        .to(countProxy, {
          value: 100,
          duration: 1.8,
          ease: 'power2.inOut',
          snap: { value: 1 },
          onUpdate: () => {
            if (counter) {
              counter.textContent = String(Math.round(countProxy.value));
            }
          },
        })
        .to(counter, { opacity: 0, y: -40, duration: 0.4 })
        .to(
          [topPanel, bottomPanel],
          {
            yPercent: (i) => (i === 0 ? -100 : 100),
            duration: 0.9,
            ease: 'power3.inOut',
            stagger: 0.05,
            onComplete: () => {
              preloader.style.pointerEvents = 'none';
              heroTl.play();
            },
          },
          '-=0.05'
        )
        .to(preloader, { autoAlpha: 0, duration: 0.01 });

      const xTo = gsap.quickTo(cursor, 'x', { duration: 0.4, ease: 'power3' });
      const yTo = gsap.quickTo(cursor, 'y', { duration: 0.4, ease: 'power3' });
      const onPointerMove = (event) => {
        xTo(event.clientX - 24);
        yTo(event.clientY - 24);
      };
      window.addEventListener('pointermove', onPointerMove);

      const ctaTargets = q('.mk-cta');
      const onCtaEnter = () => gsap.to(cursor, { scale: 1.8, duration: 0.25, ease: 'power2.out' });
      const onCtaLeave = () => gsap.to(cursor, { scale: 1, duration: 0.25, ease: 'power2.out' });
      ctaTargets.forEach((node) => {
        node.addEventListener('mouseenter', onCtaEnter);
        node.addEventListener('mouseleave', onCtaLeave);
      });

      const statValues = q('.mk-stat-value');
      ScrollTrigger.create({
        trigger: statsRow,
        start: 'top 85%',
        once: true,
        onEnter: () => {
          statValues.forEach((node) => {
            const target = Number(node.dataset.target || 0);
            const suffix = node.dataset.suffix || '';
            const proxy = { value: 0 };
            gsap.to(proxy, {
              value: target,
              duration: 1.2,
              ease: 'power2.out',
              snap: { value: 1 },
              onUpdate: () => {
                node.textContent = `${Math.round(proxy.value)}${suffix}`;
              },
            });
          });
        },
      });

      } catch (err) {
        console.warn('GSAP init failed:', err);
      }
    },
    []
  );

  return (
    <div ref={pageRef} className="mk-home marketing-root">
      <div className="mk-hero">
        <header className="mk-nav">
          <p className="mk-brand">CareVault</p>
          <div className="mk-nav-actions">
            <Link to="/login" className="mk-cta mk-cta-outline">
              Login
            </Link>
            <Link to="/signup" className="mk-cta mk-cta-solid">
              Sign up
            </Link>
          </div>
        </header>

        <div className="mk-hero-content">
          <div className="mk-hero-eyebrow">Secure Health Records</div>
          <h1 className="mk-hero-line">
            <span className="mk-hero-line-text">One place for patient records, prescriptions, and doctor access</span>
          </h1>
          <p className="mk-hero-sub">
            CareVault helps patients keep control of their history while doctors manage consultations, access, and
            clinic workflows.
          </p>
          <p className="mk-hero-feature-summary">
            CareVault brings secure patient records, doctor consultation tracking, access control, and OCR prescription
            scanning into one simple workspace, so every visit, note, and prescription stays organized and easy to
            find.
          </p>
          <div className="mk-hero-actions">
            <Link to="/signup" className="mk-cta mk-cta-solid">
              Get started
            </Link>
            <a href="#overview" className="mk-cta mk-cta-outline">
              See how it works
            </a>
          </div>

          <div className="mk-hero-stats">
            <article className="mk-stat-item">
              <span className="mk-stat-value" data-target="24" data-suffix="/7">
                24/7
              </span>
              <p>record access</p>
            </article>
            <article className="mk-stat-item">
              <span className="mk-stat-value" data-target="3" data-suffix=" roles">
                3 roles
              </span>
              <p>patients, doctors, admins</p>
            </article>
            <article className="mk-stat-item">
              <span className="mk-stat-value" data-target="1" data-suffix=" login">
                1 login
              </span>
              <p>simple access flow</p>
            </article>
            <article className="mk-stat-item">
              <span className="mk-stat-value" data-target="100" data-suffix="%">
                100%
              </span>
              <p>paperless records</p>
            </article>
          </div>
        </div>
      </div>

      <Suspense fallback={null}>
        <MarketingBelowFold />
      </Suspense>
    </div>
  );
}

export default CareVaultMarketingPage;
