import { useState } from 'react'
import heroCutout from './assets/food-rescue-cutout.webp'
import mealHall from './assets/meal-hall.webp'
import communityMeal from './assets/community-meal.webp'
import communityServing from './assets/community-serving.webp'
import { Brand, Icon } from './UI'

const journey = [
  { icon: 'food' as const, label: 'Donate', text: 'Share surplus food.' },
  { icon: 'sparkle' as const, label: 'Match', text: 'A nearby volunteer finds it.' },
  { icon: 'route' as const, label: 'Pick up', text: 'Food is collected.' },
  { icon: 'pin' as const, label: 'Deliver', text: 'It reaches an NGO.' },
  { icon: 'heart' as const, label: 'Impact', text: 'Receipt completes the rescue.' },
]
const features = [
  { icon: 'image' as const, name: 'SnapFill', text: 'Capture food information quickly with an editable AI-assisted estimate.' },
  { icon: 'clock' as const, name: 'FreshClock', text: 'See the real remaining freshness window at a glance.' },
  { icon: 'food' as const, name: 'GrabBoard', text: 'Find available food rescues and claim them securely.' },
  { icon: 'route' as const, name: 'RouteBuddy', text: 'Coordinate pickup and delivery with practical route guidance.' },
]
const roles = [
  { icon: 'food' as const, name: 'Donor', text: 'Give surplus food a purpose.', action: 'Donate food' },
  { icon: 'route' as const, name: 'Volunteer', text: 'Move food where it is needed.', action: 'Rescue food' },
  { icon: 'users' as const, name: 'NGO', text: 'Receive and distribute rescued food.', action: 'Join as NGO' },
]

export function Landing() {
  const [open,setOpen]=useState(false)
  return <main className="landing" id="main-content">
    <header className="landing-nav"><Brand /><button className="menu-button" type="button" aria-expanded={open} aria-controls="public-nav" aria-label="Toggle navigation" onClick={()=>setOpen(value=>!value)}><span/><span/><span/></button>
      <nav id="public-nav" className={open?'open':''} aria-label="Public navigation"><a href="#home">Home</a><a href="#how-it-works">How it works</a><a href="#impact">Our impact</a><a href="#roles">Participate</a><a href="/login">Log in</a><a className="button-link" href="/signup">Donate food <Icon name="arrow" /></a></nav></header>
    <section className="landing-hero" id="home">
      <div className="hero-copy"><span className="hero-kicker"><Icon name="sparkle" /> Food rescue · community · impact</span>
        <h1>Good food should never go <span>to waste.</span></h1>
        <p>ResQPlate connects surplus food with volunteers and NGOs so it can reach people instead of becoming waste.</p>
        <div className="hero-actions"><a className="button-link button-large" href="/signup">Donate food <Icon name="arrow" /></a><a className="button-link button-secondary button-large" href="/signup">Become a volunteer</a></div>
        <div className="trust-row"><span><Icon name="check" /> Real donations</span><span><Icon name="check" /> Secure coordination</span><span><Icon name="check" /> Confirmed receipt</span></div>
      </div>
      <div className="hero-cutout-wrap"><span className="hero-sun" aria-hidden="true"/><img src={heroCutout} alt="A community kitchen serving a fresh meal to a smiling student" />
        <div className="photo-caption"><span className="journey-icon"><Icon name="heart" /></span><span><strong>Food creates connection</strong>From a caring kitchen to a shared meal</span></div>
      </div>
    </section>
    <section className="landing-strip" aria-label="ResQPlate trust bar"><span>Fresh food</span><Icon name="arrow"/><span>Fast coordination</span><Icon name="arrow"/><span>Responsible delivery</span><Icon name="arrow"/><span>Verified impact</span></section>

    <section className="story-section" id="impact"><div className="story-mosaic"><img className="story-tall" src={mealHall} alt="A shared dining hall prepared with meals" /><img src={communityMeal} alt="Children sharing a community meal" /><img src={communityServing} alt="Volunteers serving prepared food" /></div><div className="story-copy"><p className="eyebrow">Why ResQPlate?</p><h2>From surplus food to shared good.</h2><p>Every day, perfectly usable food can go uneaten while communities need it. ResQPlate creates a simple, accountable bridge between the people who have food and the people who can put it to use.</p><div className="story-chain"><span>Donors</span><Icon name="arrow"/><span>Volunteers</span><Icon name="arrow"/><span>NGOs</span><Icon name="arrow"/><span>People</span></div></div></section>

    <section className="landing-section process-section" id="how-it-works"><div className="landing-section-heading"><p className="eyebrow">One connected journey</p><h2>Rescue food in five clear steps.</h2><p>Everyone knows what happens next, and every update comes from the real rescue workflow.</p></div>
      <div className="journey-grid">{journey.map((step,index)=><article className="journey-card" key={step.label}><span className="journey-number">0{index+1}</span><span className="journey-icon"><Icon name={step.icon}/></span><h3>{step.label}</h3><p>{step.text}</p>{index<journey.length-1&&<Icon name="arrow" className="journey-arrow"/>}</article>)}</div>
    </section>

    <section className="technology-section"><div className="landing-section-heading"><p className="eyebrow">Technology serving people</p><h2>Useful tools. One human mission.</h2><p>ResQPlate keeps powerful coordination features simple for every participant.</p></div><div className="feature-grid">{features.map(feature=><article className="feature-card" key={feature.name}><span className="feature-icon"><Icon name={feature.icon}/></span><div><h3>{feature.name}</h3><p>{feature.text}</p></div><Icon name="arrow" className="feature-arrow"/></article>)}</div></section>

    <section className="roles-section" id="roles"><div className="landing-section-heading"><p className="eyebrow">Everyone can take part</p><h2>Everyone has a role in food rescue.</h2></div><div className="role-story-grid">{roles.map(role=><article className="role-story-card" key={role.name}><span className="role-story-icon"><Icon name={role.icon}/></span><h3>{role.name}</h3><p>{role.text}</p><a href="/signup">{role.action} <Icon name="arrow"/></a></article>)}</div></section>

    <section className="matters-section"><div className="landing-section-heading"><p className="eyebrow">Why this matters</p><h2>One need. Three ways to act.</h2></div><div className="voice-grid"><article><span>Donor</span><p>“I have surplus food.”</p></article><article><span>Volunteer</span><p>“I can help move it.”</p></article><article><span>NGO</span><p>“We can put it to use.”</p></article></div></section>

    <div className="footer-composition"><section className="landing-impact"><div><p className="eyebrow">Start with one rescue</p><h2>One meal. One rescue. One less waste.</h2><p>Be part of a community turning surplus food into meaningful impact.</p></div><div className="landing-impact-actions"><a className="button-link button-large" href="/signup">Donate food <Icon name="arrow" /></a><a className="button-link button-secondary button-large" href="/signup">Join as volunteer</a></div></section>
    <footer className="landing-footer"><div className="footer-main"><div className="footer-brand"><Brand/><strong>Rescue food. Share hope.</strong><p>Helping good food reach people instead of becoming waste.</p></div>
      <nav className="footer-column" aria-label="About ResQPlate"><strong>ResQPlate</strong><a href="#impact">About</a><a href="#how-it-works">How It Works</a><a href="#impact">Our Impact</a></nav>
      <nav className="footer-column" aria-label="Get involved"><strong>Get Involved</strong><a href="/signup">Donate Food</a><a href="/signup">Volunteer</a><a href="/signup">NGO</a></nav>
      <div className="footer-column"><strong>Support</strong><a href="#how-it-works">Help</a><span className="footer-muted-link" tabIndex={0} aria-disabled="true" title="Contact details are not configured"><Icon name="mail" /> Contact</span></div>
      <div className="footer-connect"><strong>Follow Us</strong><div className="footer-socials"><span className="social-link" tabIndex={0} aria-disabled="true" aria-label="Instagram profile is not configured" title="Instagram profile is not configured"><Icon name="instagram" />Instagram</span><span className="social-link" tabIndex={0} aria-disabled="true" aria-label="YouTube channel is not configured" title="YouTube channel is not configured"><Icon name="youtube" />YouTube</span></div><div className="footer-contact"><Icon name="mail"/><div><strong>Contact Us</strong><p>We’d love to hear from you.</p><span>Contact details coming soon</span></div></div></div>
    </div><div className="footer-bottom"><span>© {new Date().getFullYear()} ResQPlate</span><span>Rescue food. Share hope.</span></div></footer></div>
  </main>
}
