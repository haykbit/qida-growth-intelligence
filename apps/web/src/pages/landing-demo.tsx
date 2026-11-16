import { useQuery } from "@tanstack/react-query";
import { ArrowRight, Check, Clock3, HeartHandshake, Menu, Phone, ShieldCheck, Sparkles, Star, Users, X } from "lucide-react";
import { useEffect, useState, type FormEvent } from "react";
import { Link, useParams, useSearchParams } from "react-router-dom";
import { api } from "../lib/api";
import { integer, titleCase } from "../lib/format";

type ServiceContent = { eyebrow: string; title: string; lead: string; features: Array<{ title: string; text: string }> };
type LandingVariant = "cercana" | "directa" | "local";

function landingVariant(value: string | null): LandingVariant {
  if (value === "directa" || value === "local") return value;
  return "cercana";
}

function serviceContent(service: string, municipality: string): ServiceContent {
  if (service === "acompanamiento") return {
    eyebrow: `Acompañamiento para mayores en ${municipality}`,
    title: "Más compañía. Más autonomía. Más tranquilidad.",
    lead: "Una persona de confianza para pasear, hacer gestiones, acudir a citas o compartir el día a día sin renunciar a la independencia.",
    features: [
      { title: "Compañía con propósito", text: "Un plan adaptado a sus intereses, rutinas y forma de vivir." },
      { title: "Dentro y fuera de casa", text: "Acompañamiento en paseos, citas, compras y actividades cotidianas." },
      { title: "La misma persona", text: "Priorizamos la continuidad para construir un vínculo estable y de confianza." },
    ],
  };
  if (service === "ayuda_domicilio") return {
    eyebrow: `Ayuda a domicilio en ${municipality}`,
    title: "La ayuda justa para seguir viviendo en casa.",
    lead: "Apoyo flexible en las tareas cotidianas, higiene, comidas y movilidad, con un plan que cambia cuando cambian las necesidades.",
    features: [
      { title: "Rutinas más sencillas", text: "Apoyo en higiene, vestido, comidas, medicación pautada y movilidad." },
      { title: "Horarios flexibles", text: "Desde unas horas a la semana hasta un acompañamiento más continuado." },
      { title: "Seguimiento cercano", text: "Revisamos el plan con la familia para anticiparnos a cada nueva necesidad." },
    ],
  };
  return {
    eyebrow: `Cuidado de personas mayores en ${municipality}`,
    title: "Cuidar en casa puede sentirse así de bien.",
    lead: "Encontramos a la persona cuidadora adecuada y acompañamos a la familia durante todo el servicio, con un plan pensado para su día a día.",
    features: [
      { title: "Selección personalizada", text: "Buscamos experiencia, disponibilidad y afinidad con la persona y su familia." },
      { title: "Plan de cuidados", text: "Definimos juntos rutinas, objetivos y apoyos para cuidar sin perder autonomía." },
      { title: "Acompañamiento continuo", text: "Un equipo de referencia hace seguimiento y ayuda a resolver cualquier cambio." },
    ],
  };
}

function LandingHero({ variant, content, municipality, availability, caregiversAvailable }: { variant: LandingVariant; content: ServiceContent; municipality: string; availability: string; caregiversAvailable: number }) {
  const actions = <div className="mt-9 flex flex-col gap-3 sm:flex-row"><a className="inline-flex items-center justify-center gap-2 rounded-full bg-[#ec5b48] px-6 py-4 text-sm font-semibold text-white shadow-lg shadow-[#ec5b48]/15 transition hover:-translate-y-0.5 hover:bg-[#d94b3b]" href="#contacto">Recibir orientación gratis<ArrowRight className="size-4" /></a><a className="inline-flex items-center justify-center gap-2 rounded-full border border-[#173f32]/15 bg-white/80 px-6 py-4 text-sm font-semibold text-[#173f32]" href="tel:900000000"><Phone className="size-4" />900 000 000</a></div>;

  if (variant === "directa") return <section className="bg-white" id="inicio"><div className="mx-auto grid min-h-[680px] max-w-[1280px] items-center gap-14 px-6 py-14 sm:px-10 lg:grid-cols-[1fr_0.9fr] lg:py-20"><div className="max-w-2xl"><div className="inline-flex items-center gap-2 rounded-full bg-[#eef3ef] px-3.5 py-2 text-xs font-semibold text-[#176b4d]"><span className="size-2 rounded-full bg-[#38a36f]" />{availability}</div><p className="mt-8 text-sm font-semibold text-[#176b4d]">{content.eyebrow}</p><h1 className="mt-4 text-balance text-5xl font-semibold leading-[1.02] tracking-[-0.045em] sm:text-6xl">Ayuda en casa, con un plan claro desde el primer día.</h1><p className="mt-6 max-w-xl text-lg leading-8 text-[#526057]">{content.lead}</p>{actions}<dl className="mt-12 grid max-w-xl grid-cols-3 border-y border-[#173f32]/10 py-5"><div><dt className="text-xs text-[#6d7d72]">Disponibilidad</dt><dd className="mt-1 text-2xl font-semibold">{integer.format(caregiversAvailable)}</dd></div><div><dt className="text-xs text-[#6d7d72]">Municipio</dt><dd className="mt-1 truncate text-lg font-semibold">{municipality}</dd></div><div><dt className="text-xs text-[#6d7d72]">Valoración</dt><dd className="mt-1 text-lg font-semibold">Sin coste</dd></div></dl></div><div className="relative"><img alt="Una persona mayor pasea acompañada" className="aspect-[4/5] w-full rounded-[2rem] object-cover shadow-2xl shadow-[#173f32]/10" src="/images/acompanamiento-mayores.png" /><div className="absolute -bottom-5 -left-5 max-w-60 rounded-2xl bg-[#173f32] p-5 text-white shadow-xl"><p className="text-sm font-semibold">Te orientamos en una llamada</p><p className="mt-1 text-xs leading-5 text-white/70">Necesidades, horarios y disponibilidad local.</p></div></div></div></section>;

  if (variant === "local") return <section className="bg-[#f1eee7]" id="inicio"><div className="mx-auto grid min-h-[700px] max-w-[1440px] lg:grid-cols-[1.05fr_0.95fr]"><div className="relative min-h-[460px]"><img alt="Una cuidadora conversa con una persona mayor en casa" className="absolute inset-0 size-full object-cover" src="/images/cuidados-mayores-hero.png" /><div className="absolute inset-0 bg-gradient-to-t from-[#173f32]/50 via-transparent to-transparent" /><p className="absolute bottom-8 left-8 rounded-full bg-white/90 px-4 py-2 text-xs font-semibold text-[#173f32]">Atención disponible en {municipality}</p></div><div className="flex items-center bg-[#173f32] px-7 py-16 text-white sm:px-12 lg:px-16"><div className="max-w-xl"><p className="text-xs font-semibold uppercase tracking-[0.18em] text-[#8fd1ad]">Cuidado local en {municipality}</p><h1 className="mt-5 text-balance text-5xl font-semibold leading-[1.03] tracking-[-0.04em] sm:text-6xl">Un equipo de la zona para cuidar en casa.</h1><p className="mt-6 text-lg leading-8 text-white/75">{content.lead}</p><div className="mt-8 grid grid-cols-2 gap-3"><div className="rounded-2xl border border-white/15 p-4"><p className="text-3xl font-semibold">{integer.format(caregiversAvailable)}</p><p className="mt-1 text-xs text-white/60">perfiles disponibles</p></div><div className="rounded-2xl border border-white/15 p-4"><p className="text-3xl font-semibold">24 h</p><p className="mt-1 text-xs text-white/60">para la primera orientación</p></div></div><div className="mt-8"><a className="inline-flex items-center justify-center gap-2 rounded-full bg-[#ec5b48] px-6 py-4 text-sm font-semibold text-white" href="#contacto">Consultar disponibilidad<ArrowRight className="size-4" /></a></div></div></div></div></section>;

  return <section className="relative overflow-hidden" id="inicio"><div className="mx-auto grid min-h-[720px] max-w-[1440px] lg:grid-cols-[0.92fr_1.08fr]"><div className="relative z-10 flex items-center px-6 py-16 sm:px-10 lg:px-16 xl:pl-24"><div className="max-w-xl"><div className="inline-flex items-center gap-2 rounded-full bg-[#e6eee6] px-3.5 py-2 text-xs font-semibold text-[#176b4d]"><span className="size-2 rounded-full bg-[#38a36f]" />{availability}</div><p className="mt-8 text-xs font-semibold uppercase tracking-[0.18em] text-[#6d7d72]">{content.eyebrow}</p><h1 className="mt-5 text-balance text-5xl font-semibold leading-[1.02] tracking-[-0.045em] text-[#173f32] sm:text-6xl xl:text-7xl">{content.title}</h1><p className="mt-7 max-w-lg text-pretty text-lg leading-8 text-[#526057]">{content.lead}</p>{actions}<div className="mt-10 flex flex-wrap gap-x-6 gap-y-3 text-xs font-medium text-[#526057]"><span className="flex items-center gap-2"><Check className="size-4 text-[#176b4d]" />Sin compromiso</span><span className="flex items-center gap-2"><Check className="size-4 text-[#176b4d]" />Plan personalizado</span><span className="flex items-center gap-2"><Check className="size-4 text-[#176b4d]" />Seguimiento continuo</span></div></div></div><div className="relative min-h-[520px] lg:min-h-full"><img alt="Una persona mayor conversa en casa con su cuidadora" className="absolute inset-0 size-full object-cover object-center" src="/images/cuidados-mayores-hero.png" /><div className="absolute inset-0 bg-gradient-to-t from-[#173f32]/25 via-transparent to-transparent lg:bg-gradient-to-r lg:from-[#f8f6f0] lg:via-transparent lg:to-transparent" /><div className="absolute bottom-6 left-6 right-6 rounded-2xl border border-white/50 bg-white/90 p-4 shadow-xl backdrop-blur sm:left-auto sm:w-64"><div className="flex items-center gap-2 text-[#e4a338]">{Array.from({ length: 5 }, (_, index) => <Star className="size-4 fill-current" key={index} />)}</div><p className="mt-2 text-sm font-semibold text-[#173f32]">Una atención que empieza escuchando</p><p className="mt-1 text-xs leading-5 text-[#6d7d72]">Valoración inicial con una persona del equipo.</p></div></div></div></section>;
}

export function LandingDemoPage() {
  const { municipalityId = "", service = "cuidado_personas_mayores" } = useParams();
  const [searchParams] = useSearchParams();
  const variant = landingVariant(searchParams.get("version"));
  const sourceUrl = searchParams.get("url") ?? "";
  const decisionId = searchParams.get("decision");
  const stage = searchParams.get("stage");
  const comparison = useQuery({ queryKey:["landing-record",sourceUrl,{}], queryFn:()=>api.landingInsight(sourceUrl,{}), enabled:Boolean(sourceUrl && decisionId) });
  const stored = comparison.data?.decisions.find(d=>d.id===decisionId)?.change;
  const snapshot = stored && (stage==="before" || stage==="after") ? stored[stage] : null;
  const decodedService = decodeURIComponent(service);
  const query = useQuery({
    queryKey: ["landing-demo", municipalityId, decodedService],
    queryFn: () => api.opportunity(municipalityId, decodedService, {}),
    enabled: Boolean(municipalityId && decodedService),
  });
  const [menuOpen, setMenuOpen] = useState(false);
  const [submitted, setSubmitted] = useState(false);
  const opportunity = query.data;
  const municipality = opportunity?.municipality ?? "tu municipio";
  const content = serviceContent(decodedService, municipality);
  useEffect(() => { document.title = `${content.eyebrow} | Qida Demo`; }, [content.eyebrow]);

  if (query.isLoading) return <div className="grid min-h-screen place-items-center bg-[#f7f6f1] text-sm text-[#526057]">Preparando la landing…</div>;
  if (query.isError || !opportunity) return <div className="grid min-h-screen place-items-center bg-[#f7f6f1] px-6 text-center"><div><p className="text-xl font-semibold text-[#173f32]">No encontramos esta demo.</p><Link className="mt-4 inline-block text-sm font-semibold text-[#176b4d] underline" to="/opportunities">Volver a oportunidades</Link></div></div>;

  if (decisionId && comparison.isLoading) return <p className="p-8">Cargando la versión guardada…</p>;
  if (decisionId && (!snapshot || comparison.data?.municipalityId !== municipalityId || comparison.data?.service !== decodedService))
    return <p className="p-8">Esta versión no está disponible para la landing seleccionada.</p>;
  const handleSubmit = (event: FormEvent<HTMLFormElement>) => { event.preventDefault(); setSubmitted(true); };
  const isEligible = opportunity.selectionEligibility === "eligible";
  const availability = isEligible ? "Equipo local disponible" : "Disponibilidad bajo confirmación";
  const evaluatorHref = `/opportunities/${municipalityId}/${encodeURIComponent(decodedService)}`;

  return <div className="min-h-screen bg-[#f8f6f0] font-sans text-[#173f32]" data-component-id="care-landing-demo">
    <div className="bg-[#173f32] px-4 py-2 text-center text-[11px] font-medium tracking-wide text-white sm:text-xs">Versión {variant === "cercana" ? "cercana" : variant === "directa" ? "directa" : "local"} · Demo sin envío de datos personales</div>
    <header className="sticky top-0 z-40 border-b border-[#173f32]/10 bg-[#f8f6f0]/95 backdrop-blur-xl">
      <div className="mx-auto flex h-20 max-w-[1280px] items-center justify-between px-5 sm:px-8">
        <a className="flex items-center gap-2.5" href="#inicio"><span className="grid size-10 place-items-center rounded-full bg-[#176b4d] text-lg font-bold text-white">Q</span><span className="text-lg font-semibold tracking-tight">Qida</span></a>
        <nav className="hidden items-center gap-8 text-sm font-medium lg:flex"><a className="hover:text-[#176b4d]" href="#servicio">El servicio</a><a className="hover:text-[#176b4d]" href="#como-funciona">Cómo funciona</a><a className="hover:text-[#176b4d]" href="#preguntas">Preguntas frecuentes</a></nav>
        <div className="hidden items-center gap-3 sm:flex"><Link className="rounded-full px-4 py-2 text-xs font-semibold text-[#526057] hover:bg-white" to={evaluatorHref}>Ver evaluación</Link><a className="rounded-full bg-[#ec5b48] px-5 py-3 text-sm font-semibold text-white shadow-sm transition hover:bg-[#d94b3b]" href="#contacto">Hablar con el equipo</a></div>
        <button aria-label="Abrir menú" className="grid size-10 place-items-center rounded-full bg-white sm:hidden" onClick={() => setMenuOpen((value) => !value)} type="button">{menuOpen ? <X className="size-5" /> : <Menu className="size-5" />}</button>
      </div>
      {menuOpen ? <div className="border-t border-[#173f32]/10 bg-[#f8f6f0] px-5 py-4 sm:hidden"><div className="grid gap-3 text-sm font-medium"><a href="#servicio" onClick={() => setMenuOpen(false)}>El servicio</a><a href="#como-funciona" onClick={() => setMenuOpen(false)}>Cómo funciona</a><a href="#preguntas" onClick={() => setMenuOpen(false)}>Preguntas frecuentes</a><a className="mt-2 rounded-full bg-[#ec5b48] px-5 py-3 text-center font-semibold text-white" href="#contacto" onClick={() => setMenuOpen(false)}>Hablar con el equipo</a></div></div> : null}
    </header>

    <main>
      {snapshot ? <section id="inicio" className="mx-auto grid max-w-6xl items-center gap-8 px-6 py-16 md:grid-cols-2"><div><p className="text-sm">{municipality} · {stage === "before" ? "Versión anterior" : "Nueva versión"}</p><h1 className="my-6 text-5xl font-semibold">{snapshot.title}</h1><p>{content.lead}</p><a className="mt-6 inline-block rounded-full bg-[#173f32] px-6 py-4 text-white" href="#contacto">{snapshot.cta}</a></div><img src="/images/cuidados-mayores-hero.png" className="rounded-2xl" alt="Atención a domicilio"/></section> : <LandingHero availability={availability} caregiversAvailable={opportunity.caregiversAvailable} content={content} municipality={municipality} variant={variant} />}

      <section className="border-y border-[#173f32]/10 bg-white"><div className="mx-auto grid max-w-[1200px] grid-cols-2 gap-px bg-[#173f32]/10 sm:grid-cols-4"><div className="bg-white px-5 py-7 text-center"><HeartHandshake className="mx-auto size-6 text-[#176b4d]" /><p className="mt-3 text-sm font-semibold">Cuidado humano</p></div><div className="bg-white px-5 py-7 text-center"><ShieldCheck className="mx-auto size-6 text-[#176b4d]" /><p className="mt-3 text-sm font-semibold">Selección rigurosa</p></div><div className="bg-white px-5 py-7 text-center"><Clock3 className="mx-auto size-6 text-[#176b4d]" /><p className="mt-3 text-sm font-semibold">Horarios flexibles</p></div><div className="bg-white px-5 py-7 text-center"><Users className="mx-auto size-6 text-[#176b4d]" /><p className="mt-3 text-sm font-semibold">Equipo de seguimiento</p></div></div></section>

      <section className="mx-auto max-w-[1200px] px-6 py-24 sm:px-8 sm:py-32" id="servicio"><div className="max-w-2xl"><p className="text-xs font-semibold uppercase tracking-[0.18em] text-[#ec5b48]">Cuidar mejor, vivir mejor</p><h2 className="mt-4 text-balance text-4xl font-semibold tracking-[-0.035em] sm:text-5xl">Un servicio construido alrededor de la persona.</h2><p className="mt-5 text-lg leading-8 text-[#6d7d72]">No hay dos familias iguales. Por eso empezamos por entender la situación, las rutinas y aquello que hace que una casa siga sintiéndose como casa.</p></div><div className="mt-14 grid gap-4 md:grid-cols-3">{content.features.map((feature, index) => <article className="rounded-3xl border border-[#173f32]/10 bg-white p-7" key={feature.title}><span className="grid size-10 place-items-center rounded-full bg-[#e6eee6] text-sm font-bold text-[#176b4d]">0{index + 1}</span><h3 className="mt-8 text-xl font-semibold">{feature.title}</h3><p className="mt-3 text-sm leading-6 text-[#6d7d72]">{feature.text}</p></article>)}</div></section>

      <section className="bg-[#173f32] text-white" id="como-funciona"><div className="mx-auto grid max-w-[1280px] gap-14 px-6 py-24 sm:px-8 lg:grid-cols-2 lg:items-center lg:py-28"><div className="overflow-hidden rounded-[2rem]"><img alt="Una persona mayor pasea acompañada por su cuidador" className="aspect-[4/3] size-full object-cover" src="/images/acompanamiento-mayores.png" /></div><div className="max-w-xl"><p className="text-xs font-semibold uppercase tracking-[0.18em] text-[#8fd1ad]">Así empezamos</p><h2 className="mt-4 text-4xl font-semibold tracking-[-0.035em] sm:text-5xl">Tres pasos, un equipo a vuestro lado.</h2><div className="mt-10 space-y-8">{[
            ["01", "Nos cuentas qué necesitáis", "Una conversación breve para conocer la situación y resolver las primeras dudas."],
            ["02", "Diseñamos el plan", "Concretamos horarios, apoyos y el perfil de la persona cuidadora más adecuado."],
            ["03", "Empezamos y hacemos seguimiento", "Os acompañamos desde el primer día y revisamos el servicio cuando sea necesario."],
          ].map(([step, heading, text]) => <div className="grid grid-cols-[auto_1fr] gap-5" key={step}><span className="text-sm font-semibold text-[#8fd1ad]">{step}</span><div><h3 className="text-lg font-semibold">{heading}</h3><p className="mt-2 text-sm leading-6 text-[#c8d2cc]">{text}</p></div></div>)}</div></div></div></section>

      <section className="mx-auto max-w-[1100px] px-6 py-24 sm:px-8 sm:py-32" id="preguntas"><div className="grid gap-12 lg:grid-cols-[0.7fr_1.3fr]"><div><p className="text-xs font-semibold uppercase tracking-[0.18em] text-[#ec5b48]">Preguntas frecuentes</p><h2 className="mt-4 text-4xl font-semibold tracking-[-0.035em]">Antes de empezar.</h2><p className="mt-4 text-sm leading-6 text-[#6d7d72]">Si tu situación es distinta, cuéntanosla. La primera orientación es gratuita y sin compromiso.</p></div><div className="divide-y divide-[#173f32]/10 border-y border-[#173f32]/10">{[
          ["¿Podemos empezar con pocas horas?", "Sí. El plan se adapta a la ayuda que necesitáis ahora y puede ampliarse o reducirse más adelante."],
          ["¿Cómo elegís a la persona cuidadora?", "Valoramos experiencia, referencias, disponibilidad y afinidad con las necesidades y preferencias de la familia."],
          ["¿Qué ocurre si cambian las necesidades?", "El equipo de seguimiento revisa el plan y coordina los cambios de horario o de apoyos necesarios."],
          ["¿Hay disponibilidad en el municipio?", isEligible ? `La demo refleja cobertura y capacidad operativa disponible en ${municipality}. La fecha concreta se confirma durante la valoración.` : `La cobertura existe, pero la disponibilidad actual en ${municipality} debe confirmarse antes de empezar.`],
        ].map(([question, answer]) => <details className="group py-5" key={question}><summary className="flex cursor-pointer list-none items-center justify-between gap-5 text-base font-semibold"><span>{question}</span><span className="grid size-8 place-items-center rounded-full bg-white text-xl transition group-open:rotate-45">+</span></summary><p className="max-w-2xl pt-3 text-sm leading-6 text-[#6d7d72]">{answer}</p></details>)}</div></div></section>

      <section className="px-4 pb-4" id="contacto"><div className="mx-auto grid max-w-[1400px] overflow-hidden rounded-[2rem] bg-[#e6eee6] lg:grid-cols-[1fr_0.82fr]"><div className="px-7 py-14 sm:px-12 lg:px-20 lg:py-20"><Sparkles className="size-7 text-[#176b4d]" /><h2 className="mt-6 max-w-xl text-balance text-4xl font-semibold tracking-[-0.035em] sm:text-5xl">Cuéntanos qué necesitáis. Te orientamos.</h2><p className="mt-5 max-w-lg text-base leading-7 text-[#526057]">Una persona del equipo estudiará vuestra situación y os explicará las opciones disponibles en {municipality}.</p><div className="mt-8 rounded-2xl bg-white/65 p-5 text-sm text-[#526057]"><p className="font-semibold text-[#173f32]">Esta es una demo segura</p><p className="mt-1 leading-6">El formulario simula la conversión, pero no almacena ni envía los datos introducidos.</p></div></div><div className="bg-white p-7 sm:p-10 lg:m-4 lg:rounded-[1.5rem] lg:p-12">{submitted ? <div className="flex min-h-96 flex-col items-center justify-center text-center"><span className="grid size-14 place-items-center rounded-full bg-[#e6eee6]"><Check className="size-7 text-[#176b4d]" /></span><h3 className="mt-6 text-2xl font-semibold">Solicitud simulada</h3><p className="mt-3 max-w-sm text-sm leading-6 text-[#6d7d72]">En una landing publicada, este evento quedaría medido y después se reconciliaría con el CRM. Aquí no se ha enviado ningún dato.</p><button className="mt-6 text-sm font-semibold text-[#176b4d] underline" onClick={() => setSubmitted(false)} type="button">Volver al formulario</button></div> : <form className="space-y-5" onSubmit={handleSubmit}><div><p className="text-xl font-semibold">Recibe orientación gratuita</p><p className="mt-1 text-sm text-[#6d7d72]">Te llamamos para conocer la situación.</p></div><label className="block text-xs font-semibold">Nombre<input className="mt-2 h-12 w-full rounded-xl border border-[#173f32]/15 bg-[#fafaf7] px-4 text-sm outline-none focus:border-[#176b4d]" name="name" placeholder="Tu nombre" required /></label><label className="block text-xs font-semibold">Teléfono<input className="mt-2 h-12 w-full rounded-xl border border-[#173f32]/15 bg-[#fafaf7] px-4 text-sm outline-none focus:border-[#176b4d]" inputMode="tel" name="phone" placeholder="600 000 000" required /></label><label className="block text-xs font-semibold">¿Qué tipo de ayuda buscáis?<select className="mt-2 h-12 w-full rounded-xl border border-[#173f32]/15 bg-[#fafaf7] px-4 text-sm outline-none focus:border-[#176b4d]" defaultValue={decodedService} name="service"><option value="cuidado_personas_mayores">Cuidado de personas mayores</option><option value="ayuda_domicilio">Ayuda a domicilio</option><option value="acompanamiento">Acompañamiento</option></select></label><label className="flex items-start gap-3 text-[11px] leading-5 text-[#6d7d72]"><input className="mt-1" required type="checkbox" />He leído la información de esta demo y entiendo que los datos no se enviarán.</label><button className="flex h-13 w-full items-center justify-center gap-2 rounded-full bg-[#ec5b48] px-6 py-4 text-sm font-semibold text-white transition hover:bg-[#d94b3b]" type="submit">Solicitar llamada<ArrowRight className="size-4" /></button></form>}</div></div></section>
    </main>

    <footer className="px-6 py-10"><div className="mx-auto flex max-w-[1280px] flex-col gap-4 text-xs text-[#6d7d72] sm:flex-row sm:items-center sm:justify-between"><div className="flex items-center gap-2"><span className="grid size-7 place-items-center rounded-full bg-[#176b4d] font-bold text-white">Q</span><span>Qida · Landing demo de {titleCase(decodedService)}</span></div><div className="flex items-center gap-5"><span>{integer.format(opportunity.caregiversAvailable)} perfiles disponibles en el dato sintético</span><Link className="font-semibold text-[#176b4d] underline" to={evaluatorHref}>Abrir su evaluación</Link></div></div></footer>
  </div>;
}
