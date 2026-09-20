import { Brand, Icon } from './UI'

const journey = [
  { icon: 'food' as const, label: 'Donate', text: 'Share good surplus food' },
  { icon: 'sparkle' as const, label: 'Match', text: 'RouteBuddy finds the right rescue' },
  { icon: 'route' as const, label: 'Pick up', text: 'A volunteer collects it' },
  { icon: 'heart' as const, label: 'Impact', text: 'An NGO confirms delivery' },
]

export function Landing() {
  return <main className="landing" id="main-content">
    <header className="landing-nav"><Brand /><nav aria-label="Public navigation"><a href="#how-it-works">How it works</a><a href="/login">Log in</a><a className="button-link" href="/signup">Get started <Icon name="arrow" /></a></nav></header>
    <section className="landing-hero">
      <div className="hero-copy"><span className="hero-kicker"><Icon name="sparkle" /> Real-time food rescue</span>
        <h1>Turn surplus food into <span>shared good.</span></h1>
        <p>Connect excess food with volunteers and NGOs who can move it where it matters most—fresh, fast and responsibly.</p>
        <div className="hero-actions"><a className="button-link button-large" href="/signup">Donate food <Icon name="arrow" /></a><a className="button-link button-secondary button-large" href="/signup">Join as volunteer</a></div>
        <div className="trust-row"><span><Icon name="check" /> Real donations</span><span><Icon name="check" /> Secure coordination</span><span><Icon name="check" /> Verified receipt</span></div>
      </div>
      <div className="hero-visual" aria-label="Food rescue journey preview">
        <div className="hero-orbit orbit-one" /><div className="hero-orbit orbit-two" />
        <div className="hero-plate"><Icon name="food" /><strong>Vegetable rice</strong><span>Fresh · 12 plates</span></div>
        <div className="floating-card card-pickup"><Icon name="route" /><span><strong>Volunteer matched</strong>Pickup confirmed</span></div>
        <div className="floating-card card-impact"><Icon name="heart" /><span><strong>Delivery complete</strong>12 meals rescued</span></div>
      </div>
    </section>
    <section className="landing-strip" aria-label="Product capabilities"><span>SnapFill AI</span><span>FreshClock</span><span>PlateCount</span><span>RouteBuddy</span><span>Live rescue updates</span></section>
    <section className="landing-section" id="how-it-works"><div className="landing-section-heading"><p className="eyebrow">One connected journey</p><h2>From surplus to someone’s next meal.</h2><p>Every role sees exactly what matters, while real status updates keep the rescue moving.</p></div>
      <div className="journey-grid">{journey.map((step,index)=><article className="journey-card" key={step.label}><span className="journey-number">0{index+1}</span><span className="journey-icon"><Icon name={step.icon}/></span><h3>{step.label}</h3><p>{step.text}</p>{index<journey.length-1&&<Icon name="arrow" className="journey-arrow"/>}</article>)}</div>
    </section>
    <section className="landing-impact"><div><p className="eyebrow">Built for real impact</p><h2>Fresh food deserves a faster path.</h2><p>ResQPlate combines secure claims, freshness guidance, live rescue progress and confirmed NGO receipt in one focused platform.</p></div><a className="button-link button-large" href="/signup">Start rescuing food <Icon name="arrow" /></a></section>
    <footer className="landing-footer"><Brand/><p>Rescue food. Share hope.</p><a href="/login">Member login</a></footer>
  </main>
}
