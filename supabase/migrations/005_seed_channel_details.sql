-- Seed channel voice, brand attributes, terminology, and visual scenes
-- This migration enriches the existing channels with comprehensive brand voice data

-- ============================================================================
-- RESIDENTIAL CHANNEL
-- ============================================================================
UPDATE public.channels
SET 
  voice_foundation = 'Sonance Residential speaks with confident expertise that empowers rather than overwhelms. We are the trusted partner who elevates experiences through audio that''s felt, not seen—blending technical mastery with an understanding of how people actually live. Our voice is expert without ego, inviting rather than institutional, purposeful and clear, always serving as a forward-thinking partner. We lead from deep knowledge, not superiority, making complex audio engineering understandable without talking down. Professional doesn''t mean stiff—we''re approachable experts who understand that great audio serves life''s moments, from morning coffee to movie nights.',
  
  voice_attributes = '[
    {
      "name": "Expert Without Ego",
      "description": "Lead from deep knowledge and share insights generously, making complex audio engineering understandable without talking down. Avoid industry jargon without context and claims without substance."
    },
    {
      "name": "Inviting, Not Institutional",
      "description": "Professional but not stiff. Approachable experts who understand that great audio serves life''s moments. Avoid overly casual language and corporate buzzwords without meaning."
    },
    {
      "name": "Purposeful and Clear",
      "description": "Every word earns its place. Respect audience time with direct, benefit-focused communication. Avoid redundancy, vague promises, and overused marketing clichés."
    },
    {
      "name": "Forward-Thinking Partner",
      "description": "Not just selling products—advancing the industry. Speak as collaborators invested in dealers'' success and homeowners'' satisfaction. Avoid reactive positioning and short-term thinking."
    }
  ]'::jsonb,
  
  we_say = ARRAY[
    'Designed to disappear',
    'Architectural audio',
    'Premium performance',
    'Invisible integration',
    'Precision engineering',
    'Immersive experience',
    'Seamless installation',
    'Tested in the field',
    'Acoustic comfort',
    'Custom integrator',
    'CEDIA professionals',
    'Whole-home audio',
    'Visual Experience Series',
    'Transform any space',
    'Room-filling sound',
    'Life is better with music',
    'Even, balanced sound',
    'Small Aperture',
    'Invisible speakers',
    'High-performance',
    'Architecture-respecting'
  ],
  
  we_dont_say = ARRAY[
    'Hidden speakers (use "invisible" or "designed to disappear")',
    'Luxury audio (too exclusive/intimidating)',
    'Cutting-edge/bleeding-edge (overused)',
    'Game-changer/revolutionary (without substance)',
    'World-class (vague claim)',
    'Premium quality (redundant)',
    'Installer (use "custom integrator")',
    'Cheap or budget (use "accessible" or "value")',
    'Installation (use "integration")',
    'Awesome sauce, super cool (too casual)'
  ],
  
  visual_scenes = '[
    {
      "name": "The Morning Ritual",
      "looks_like": "Sunlight streaming through floor-to-ceiling windows, coffee brewing, jazz filling the kitchen from invisible speakers. Clean modern architecture with natural materials. Music seems to flow from everywhere, becoming part of life itself.",
      "excludes": "Visible speakers, cluttered countertops, technology as focal point, harsh lighting"
    },
    {
      "name": "Movie Night Immersion",
      "looks_like": "Family room with Visual Experience speakers behind the TV, zero visible speaker boxes. Immersive surround sound fills every corner. Technology serves the experience, not the other way around. Clean sight lines to screen.",
      "excludes": "Tower speakers, visible wiring, equipment racks in view, technology competing with design"
    },
    {
      "name": "Whole-Home Flow",
      "looks_like": "Music flowing seamlessly from room to room. Small Aperture speakers color-matched to ceiling, integrated like recessed lighting. Even, balanced sound providing perfect volume everywhere. Architecture remains the star.",
      "excludes": "Visible grilles that contrast with ceiling, hot spots/dead spots, speakers dominating the space"
    },
    {
      "name": "Outdoor Living",
      "looks_like": "Patio or deck with outdoor speakers integrated into architecture and landscape. Sound feels natural, enhancing conversation without overwhelming. Design-conscious placement respects the aesthetic.",
      "excludes": "Obtrusive speaker boxes, harsh volumes, technology interrupting the outdoor experience"
    },
    {
      "name": "Intimate Spaces",
      "looks_like": "Powder rooms, hallways, walk-in closets with Single Stereo Technology (SST) speakers. Premium audio in petite spaces without compromising design. Subtle integration in every corner of the home.",
      "excludes": "Oversized speakers in small spaces, visible compromises, acoustic dead zones"
    }
  ]'::jsonb
WHERE name = 'Residential';

-- ============================================================================
-- PROFESSIONAL CHANNEL
-- ============================================================================
UPDATE public.channels
SET 
  voice_foundation = 'Sonance Professional speaks with technical credibility and confidence earned through 40+ years of architectural audio leadership. Our voice is precise, performance-focused, and authentically professional—less lifestyle, more engineering. We address experienced commercial system integrators who value reliability, efficiency, and engineered solutions. Our tone is technical but not exaggerated, clear and confident without hype. We understand that commercial integrators are not influenced by marketing fluff—they seek authenticity, proof, and solutions that protect project timelines and installer reputation.',
  
  voice_attributes = '[
    {
      "name": "Technical and Credible",
      "description": "Speak with engineering precision. Commercial integrators are technically proficient and detail-oriented. Provide specific performance data, installation advantages, and reliability metrics. Avoid marketing hyperbole."
    },
    {
      "name": "Confident but Not Exaggerated",
      "description": "State capabilities clearly without overselling. Reliability and proven performance speak louder than superlatives. Focus on real-world commercial applications and project success."
    },
    {
      "name": "Efficiency-Focused",
      "description": "Emphasize ease of installation, reduced complexity, time savings. Commercial projects have tight timelines—position Sonance Professional as the solution that installs seamlessly and performs reliably."
    },
    {
      "name": "Complete Solutions Mindset",
      "description": "From loudspeakers to amplification—present comprehensive commercial audio systems. Highlight 70V/100V compatibility, dedicated amplification, and thoughtful integration into commercial architecture."
    }
  ]'::jsonb,
  
  we_say = ARRAY[
    'Commercial audio solutions',
    'Engineered for commercial performance',
    'Complete solutions—loudspeakers to amplification',
    '70V/100V systems',
    'Dedicated amplification',
    'Commercial integrators',
    'System reliability',
    'Project success',
    'Ease of installation',
    'Visually unobtrusive',
    'Architecture-respecting',
    'Thoughtfully integrated',
    'Superior sound in commercial environments',
    'Blaze by Sonance',
    'Hospitality audio',
    'Corporate AV',
    'Retail audio',
    'Restaurant sound systems',
    'Commercial system design',
    'Proven performance'
  ],
  
  we_dont_say = ARRAY[
    'Lifestyle audio (stay business-focused)',
    'Home theater (wrong channel)',
    'Luxury (not commercial language)',
    'Cutting-edge (use "proven" or "engineered")',
    'Revolutionary (too hype-driven)',
    'Installer (use "commercial integrator" or "system integrator")',
    'Hidden (use "unobtrusive" or "integrated")',
    'Smart home (residential language)'
  ],
  
  visual_scenes = '[
    {
      "name": "Hospitality Elegance",
      "looks_like": "Hotel lobby or restaurant with speakers seamlessly integrated into commercial architecture. Sound enhances ambiance without calling attention to itself. Premium guest experience without visual clutter.",
      "excludes": "Visible speaker boxes, residential-style speakers, obtrusive mounting, technology competing with interior design"
    },
    {
      "name": "Corporate Professionalism",
      "looks_like": "Conference rooms and office spaces with distributed 70V audio. Clear speech intelligibility, even coverage, professional aesthetics. Technology that supports productivity without distraction.",
      "excludes": "Consumer-grade equipment, visible wiring, acoustic dead zones, unprofessional appearance"
    },
    {
      "name": "Retail Atmosphere",
      "looks_like": "Retail environment with background music and announcement capability. Consistent sound throughout the space, branded audio experience, reliable daily operation.",
      "excludes": "Inconsistent coverage, harsh announcements, visible commercial speakers that clash with retail design"
    },
    {
      "name": "Restaurant Ambiance",
      "looks_like": "Dining spaces where music enhances the experience without overwhelming conversation. Zoned audio control, even coverage, design integration that respects the restaurant''s aesthetic vision.",
      "excludes": "Hot spots and dead spots, speakers that dominate the visual space, poor speech intelligibility"
    }
  ]'::jsonb
WHERE name = 'Professional';

-- ============================================================================
-- ENTERPRISE CHANNEL (iPort)
-- ============================================================================
UPDATE public.channels
SET 
  voice_foundation = 'iPort speaks with confident, purposeful authority—intelligent but accessible, business-forward but human, solution-oriented and visionary. We communicate value to enterprise audiences by articulating not just what we do, but why it matters. Our voice is clarity-driven and outcome-focused, centering on the impact clients achieve: increased efficiency, modernized workflows, elevated experiences. We are Apple-centric specialists who transform iPad and iPhone into mission-critical enterprise tools through purpose-built hardware and modular systems. Every message demonstrates how iPort enables businesses to work smarter, serve customers better, and transform business outcomes.',
  
  voice_attributes = '[
    {
      "name": "Confident and Purposeful",
      "description": "Speak clearly with authority but without arrogance. Use active verbs that convey outcome and movement: enable, drive, empower, transform. Confidence without jargon overload."
    },
    {
      "name": "Business-Forward, Human-Centered",
      "description": "Address enterprise audiences with grounded, real-world impact language. Technical when necessary, but always focused on business value and human outcomes."
    },
    {
      "name": "Solution-Oriented and Visionary",
      "description": "Lead with impact—what clients achieve with iPort (efficiency gains, reliability, scalability). Use real-world applications: front-of-house POS, self-service check-in, mobile inventory workflows."
    },
    {
      "name": "iOS-Centric Commitment",
      "description": "Built exclusively for Apple. Every product is engineered to maximize the value of iOS devices in business settings. Emphasize modular, scalable, enterprise-grade design."
    }
  ]'::jsonb,
  
  we_say = ARRAY[
    'Enterprise-grade iOS solutions',
    'Transform iPad and iPhone into enterprise tools',
    'Purpose-built for Apple devices',
    'Modular enterprise platform',
    'Scalable iOS integration',
    'Mission-critical tools',
    'Empower teams',
    'Enable smarter operations',
    'Elevated customer experiences',
    'iOS-centric innovation',
    'Front-of-house POS expansion',
    'Self-service check-in experiences',
    'Mobile inventory workflows',
    'Fortune 100 deployments',
    'Designed for iOS. Built for Enterprise.',
    'Seamless iOS integration',
    'Reliable uptime',
    'Device management ready',
    'Engineered solutions'
  ],
  
  we_dont_say = ARRAY[
    'Solutions (overused—use "purpose-built systems" or "modular platform")',
    'Devices (use "iPad and iPhone" when specific)',
    'Luxury (wrong audience—use "enterprise-grade")',
    'Best solution (generic—back up claims with specifics)',
    'Consumer products (emphasize enterprise focus)',
    'Accessories (use "enterprise hardware solutions")',
    'Cases and mounts (use "integrated mounting systems")',
    'Hidden (not relevant to iPort positioning)'
  ],
  
  visual_scenes = '[
    {
      "name": "Retail Point of Sale",
      "looks_like": "iPad mounted as POS terminal in modern retail environment. Clean, professional mounting. Customer-facing display with secure payment integration. Frontline staff using iPad confidently for transactions.",
      "excludes": "Consumer-grade mounts, cluttered checkout counters, unstable or insecure device placement, residential accessories"
    },
    {
      "name": "Hospitality Check-In",
      "looks_like": "Hotel lobby with iPad-based self-service check-in kiosks. Elegant, branded presentation. Guests interacting seamlessly with touch interface. Staff using iPad for mobile guest services.",
      "excludes": "Bulky kiosks, visible cables, generic consumer tablets, unprofessional appearance"
    },
    {
      "name": "Corporate Conference Room",
      "looks_like": "iPad mounted as room control system. Seamless control of AV, lighting, climate. Professional aesthetic that matches corporate interior design. Reliable, always-ready interface.",
      "excludes": "Visible charging cables, consumer mounting solutions, unreliable connectivity, unprofessional presentation"
    },
    {
      "name": "Healthcare Mobile Workflows",
      "looks_like": "Medical staff using iPads with iPort protective cases for mobile charting and patient care. Secure, hygienic, reliable. Workflow efficiency in clinical environments.",
      "excludes": "Consumer cases, exposed charging ports, unstable mounts, unprofessional healthcare appearance"
    },
    {
      "name": "Enterprise Fleet Deployment",
      "looks_like": "Multiple iPads deployed across Fortune 100 organization. Consistent mounting, device management integration, scalable rollout. Business transformation at scale.",
      "excludes": "Inconsistent hardware, lack of device management, consumer-grade deployment"
    }
  ]'::jsonb
WHERE name = 'Enterprise';

-- ============================================================================
-- MARINE CHANNEL
-- ============================================================================
UPDATE public.channels
SET 
  voice_foundation = 'Sonance Marine extends our architectural audio expertise to the unique demands of marine environments. We speak with technical confidence earned through marine-grade engineering—addressing superyacht integrators, cruise ship specifiers, and day boat enthusiasts who require audio solutions that perform flawlessly in harsh conditions while respecting yacht design aesthetics. Our voice balances luxury and durability, sophistication and reliability. Marine audio must be designed to disappear into yacht architecture while withstanding saltwater, moisture, UV exposure, and constant motion. We understand that marine integrators demand the same invisible integration as residential, with the added complexity of maritime-grade materials and certifications.',
  
  voice_attributes = '[
    {
      "name": "Marine-Tough, Design-Elegant",
      "description": "Balance engineering rigor with aesthetic sophistication. Speak to both technical requirements (marine-grade materials, corrosion resistance) and design integration (invisible audio on yachts)."
    },
    {
      "name": "Luxury Maritime Focus",
      "description": "Address superyacht and cruise ship markets with appropriate sophistication. Acknowledge the premium nature of marine audio without being exclusive or intimidating."
    },
    {
      "name": "Reliability Under Pressure",
      "description": "Emphasize performance in harsh marine environments—saltwater, moisture, UV, temperature extremes. Position Sonance Marine as engineered for reliability where failure is not an option."
    },
    {
      "name": "Designed to Disappear at Sea",
      "description": "Apply the core Sonance philosophy to maritime contexts. Invisible integration is even more critical on yachts where interior design is paramount and space is at a premium."
    }
  ]'::jsonb,
  
  we_say = ARRAY[
    'Marine-grade audio',
    'Engineered for maritime environments',
    'Superyacht audio solutions',
    'Designed to disappear at sea',
    'Saltwater-resistant',
    'UV-stable materials',
    'Corrosion-resistant',
    'Maritime-certified',
    'Yacht audio integration',
    'Cruise ship entertainment',
    'Day boat performance',
    'Marine-adapted architecture',
    'Luxury maritime audio',
    'Harsh environment reliability',
    'Onboard entertainment',
    'Naval architecture integration',
    'Coastal and offshore performance'
  ],
  
  we_dont_say = ARRAY[
    'Waterproof (use "marine-grade" or "engineered for maritime environments")',
    'Boat speakers (too casual—use "marine audio solutions")',
    'Home theater (wrong context)',
    'Cheap or budget (inappropriate for luxury marine)',
    'Weather-resistant (insufficient—use "marine-grade" or "saltwater-resistant")',
    'Outdoor speakers (different context than marine)'
  ],
  
  visual_scenes = '[
    {
      "name": "Superyacht Salon",
      "looks_like": "Luxurious yacht interior with invisible speakers integrated into walls and ceilings. Premium sound throughout the salon without visible hardware. Design respects the yacht''s aesthetic vision. Marine-grade materials that look residential.",
      "excludes": "Visible marine speakers, obtrusive mounting, commercial-looking hardware, design compromises"
    },
    {
      "name": "Flybridge Entertainment",
      "looks_like": "Open-air flybridge with marine audio performing in direct saltwater spray and UV exposure. Sound carries over ambient noise without harshness. Speakers engineered to withstand elements while delivering quality audio.",
      "excludes": "Consumer-grade outdoor speakers, visible corrosion, failed grilles, audio dropout in harsh conditions"
    },
    {
      "name": "Cruise Ship Stateroom",
      "looks_like": "Compact cruise ship cabin with distributed audio. Space-efficient integration, reliable performance across thousands of staterooms. Consistent guest experience shipwide.",
      "excludes": "Bulky speakers consuming limited space, inconsistent performance, visible commercial hardware"
    },
    {
      "name": "Day Boat Cockpit",
      "looks_like": "Sport yacht cockpit with marine speakers performing in splash zones. Fun, energetic sound for day cruising. Durable, reliable, weather-resistant without sacrificing audio quality.",
      "excludes": "Failed speakers after a season, harsh audio quality, visible saltwater damage"
    }
  ]'::jsonb
WHERE name = 'Marine';

-- ============================================================================
-- GREEN CHANNEL (Outdoor/Landscape)
-- ============================================================================
UPDATE public.channels
SET 
  voice_foundation = 'Sonance Green Channel speaks to landscape professionals, outdoor living designers, and homeowners who understand that great outdoor spaces deserve the same audio excellence as indoor environments. Our voice is earthy yet sophisticated, emphasizing natural integration—speakers that blend into landscapes like they were planted there. We address landscape supply channels and outdoor living specialists with a tone that respects both horticultural design and acoustic engineering. Outdoor audio should enhance the experience of being outside, not dominate it. We speak with confident expertise about weather resistance, aesthetic integration, and the joy of music flowing through outdoor living spaces.',
  
  voice_attributes = '[
    {
      "name": "Natural Integration Focus",
      "description": "Emphasize how speakers blend into landscapes, gardens, and outdoor architecture. Use language that resonates with landscape design: organic, integrated, harmonious with nature."
    },
    {
      "name": "Outdoor Living Expertise",
      "description": "Address landscape professionals and outdoor living designers as equals. Speak to both aesthetic considerations (design harmony) and technical requirements (weather resistance, coverage)."
    },
    {
      "name": "Weather-Resilient Performance",
      "description": "Clearly communicate durability in outdoor conditions—UV resistance, temperature extremes, moisture. Balance technical specs with experiential benefits."
    },
    {
      "name": "Lifestyle Enhancement",
      "description": "Connect outdoor audio to lifestyle moments: al fresco dining, poolside relaxation, garden entertaining. Music enhances outdoor living without overwhelming the natural environment."
    }
  ]'::jsonb,
  
  we_say = ARRAY[
    'Outdoor audio solutions',
    'Landscape audio integration',
    'Designed for outdoor living',
    'Weather-resistant performance',
    'UV-stable materials',
    'Garden and patio audio',
    'Poolside entertainment',
    'Outdoor architecture integration',
    'All-season performance',
    'Landscape design harmony',
    'Al fresco audio',
    'Natural aesthetics',
    'Outdoor entertaining',
    'Backyard soundscapes',
    'Temperature-resilient',
    'Moisture-resistant'
  ],
  
  we_dont_say = ARRAY[
    'Outdoor speakers (too generic—use "outdoor audio solutions" or "landscape audio")',
    'Weatherproof (use "weather-resistant" or "all-season")',
    'Hidden (use "naturally integrated" or "landscape-integrated")',
    'Cheap or budget (use "value-focused" or "accessible")',
    'Marine speakers (different channel)',
    'Indoor/outdoor (sounds like compromise—focus on purpose-built outdoor)'
  ],
  
  visual_scenes = '[
    {
      "name": "Garden Sanctuary",
      "looks_like": "Landscaped garden with speakers integrated into natural elements—rock formations, planters, landscape beds. Music flows through the space like a natural element. Speakers complement the garden design, not compete with it.",
      "excludes": "Obtrusive speaker boxes, visible technology in natural settings, speakers that break the aesthetic spell"
    },
    {
      "name": "Poolside Resort Experience",
      "looks_like": "Pool deck and outdoor living area with distributed audio. Even coverage for swimmers and loungers. Speakers that withstand splash zones and UV exposure. Resort-quality sound in residential backyard.",
      "excludes": "Harsh volumes, hot spots and dead spots, visible corrosion, failed speakers after one season"
    },
    {
      "name": "Al Fresco Dining",
      "looks_like": "Patio or outdoor kitchen with ambient music enhancing the dining experience. Sound supports conversation without overwhelming it. Speakers integrated into pergola, outdoor structure, or landscape design.",
      "excludes": "Intrusive speakers dominating the visual space, volumes that prevent conversation, technology competing with outdoor aesthetic"
    },
    {
      "name": "Landscape Lighting Integration",
      "looks_like": "Outdoor audio coordinated with landscape lighting design. Speakers blend with lighting fixtures and hardscape elements. Unified outdoor technology strategy that feels intentional and integrated.",
      "excludes": "Mismatched technologies, speakers and lights competing visually, lack of design cohesion"
    }
  ]'::jsonb
WHERE name = 'Green';

-- ============================================================================
-- PRODUCTION BUILD CHANNEL
-- ============================================================================
UPDATE public.channels
SET 
  voice_foundation = 'Sonance Production Build speaks the language of efficiency, value, and builder partnerships. We address production home builders who need reliable audio solutions that install quickly at pre-wire stage, deliver quality performance, and meet project budgets. Our voice is straightforward, pragmatic, and partnership-oriented—emphasizing speed of installation, builder-friendly pricing, and homeowner satisfaction. We understand that production builders operate on tight timelines and margins. Sonance supports HomePro programs and production builder communities with invisible speakers and TV audio solutions that enhance home value without complicating construction workflows. Our tone is confident but accessible, focused on practical benefits and proven builder relationships.',
  
  voice_attributes = '[
    {
      "name": "Builder-Focused Efficiency",
      "description": "Emphasize quick installation, pre-wire stage readiness, simplified product selection. Speak to project timelines, labor costs, and installation speed. Builders need solutions that don''t slow down construction."
    },
    {
      "name": "Value Without Compromise",
      "description": "Address budget consciousness while maintaining quality standards. Position as smart builder choice—quality performance at production build pricing. Avoid "cheap" language; focus on value and homeowner satisfaction."
    },
    {
      "name": "Partnership and Support",
      "description": "Speak as a reliable partner who understands builder challenges. Emphasize HomePro programs, builder education, consistent supply chain, and responsive support."
    },
    {
      "name": "Homeowner Satisfaction Driver",
      "description": "Connect audio integration to home value and buyer appeal. Invisible speakers and TV audio are differentiators in competitive production markets. Happy homeowners lead to referrals."
    }
  ]'::jsonb,
  
  we_say = ARRAY[
    'Production builder solutions',
    'HomePro partnerships',
    'Pre-wire stage efficiency',
    'Builder-friendly installation',
    'Invisible speakers for production homes',
    'TV audio packages',
    'Quick installation',
    'Value-focused performance',
    'Homeowner satisfaction',
    'Consistent supply chain',
    'Builder education programs',
    'Project timeline support',
    'Competitive builder pricing',
    'New construction audio',
    'Model home showcases',
    'Production home value enhancement'
  ],
  
  we_dont_say = ARRAY[
    'Cheap or budget (use "value-focused" or "production pricing")',
    'Basic or entry-level (use "core solutions" or "production-optimized")',
    'Luxury or high-end (wrong market positioning)',
    'Custom integration (use "production build" or "new construction")',
    'CEDIA professionals (different integrator channel)',
    'Expensive (focus on value, not cost)'
  ],
  
  visual_scenes = '[
    {
      "name": "Production Home Great Room",
      "looks_like": "Open-concept great room in production home with invisible speakers in ceiling. TV audio package installed behind the TV. Clean sight lines, no visible speaker boxes. Homeowner enjoying movie night in their new home.",
      "excludes": "Visible tower speakers, cluttered AV equipment, custom integration complexity"
    },
    {
      "name": "Pre-Wire Stage Efficiency",
      "looks_like": "New construction site with speakers being installed at pre-wire stage. Quick, straightforward installation that doesn''t slow down construction schedule. Builder-friendly packaging and documentation.",
      "excludes": "Complex installation procedures, unclear documentation, installation delays"
    },
    {
      "name": "Model Home Showcase",
      "looks_like": "Model home demonstrating whole-home audio. Buyers experiencing music throughout the home, controlled from their phone. Invisible integration that shows as a premium feature without visible hardware.",
      "excludes": "Visible speakers that look like afterthoughts, complicated control systems, missed sales opportunities"
    },
    {
      "name": "Kitchen and Patio Flow",
      "looks_like": "Production home with audio flowing from kitchen to covered patio. Seamless indoor-outdoor living. Pre-wired outdoor speakers on patio. Builder-installed audio as standard or popular upgrade.",
      "excludes": "Disconnected indoor/outdoor audio, visible outdoor speaker boxes that clash with production home aesthetic"
    }
  ]'::jsonb
WHERE name = 'Production Build';
