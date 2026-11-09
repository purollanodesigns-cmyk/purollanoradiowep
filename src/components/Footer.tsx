import { Link } from "@tanstack/react-router";
import { Mail, MessageCircle } from "lucide-react";
import { LOGO } from "@/lib/assets";

export function Footer() {
  return (
    <footer className="mt-24 border-t-4 border-[var(--oro)] bg-[var(--carbon)] pb-32 pt-16 text-[var(--crema)]">
      <div className="mx-auto grid max-w-7xl gap-10 px-6 md:grid-cols-4">
        <div className="md:col-span-2">
          <div className="flex items-center gap-3">
            <img src={LOGO} alt="Puro Llano Radio" className="h-14 w-14 object-contain" />
            <div>
              <div className="font-display text-2xl text-[var(--oro)]">Puro Llano Radio</div>
              <div className="font-body text-xs uppercase tracking-[0.3em] text-white/60">Emisora online del folklore llanero</div>
            </div>
          </div>
          <p className="mt-5 max-w-md text-sm leading-relaxed text-white/70">
            Emisora online fundada para salvaguardar, promover y proyectar el folklore y la
            música llanera al mundo. Transmitimos desde Puerto Ayacucho, Amazonas, Venezuela.
          </p>
        </div>

        <div>
          <div className="mb-4 font-display text-xs uppercase tracking-[0.3em] text-[var(--oro)]">Navegación</div>
          <ul className="space-y-2 text-sm">
            <li><Link to="/" className="text-white/80 hover:text-[var(--oro)]">Inicio</Link></li>
            <li><Link to="/artistas" className="text-white/80 hover:text-[var(--oro)]">Artistas</Link></li>
            <li><Link to="/acerca" className="text-white/80 hover:text-[var(--oro)]">Acerca</Link></li>
            <li><Link to="/politica-privacidad" className="text-white/80 hover:text-[var(--oro)]">Política de privacidad</Link></li>
          </ul>
        </div>

        <div>
          <div className="mb-4 font-display text-xs uppercase tracking-[0.3em] text-[var(--oro)]">Contacto</div>
          <ul className="space-y-2 text-sm text-white/80">
            <li>
              <a href="mailto:purollanoradio@gmail.com" className="inline-flex items-center gap-2 hover:text-[var(--oro)]">
                <Mail className="h-3.5 w-3.5" /> purollanoradio@gmail.com
              </a>
            </li>
            <li>
              <a href="https://wa.me/584164242274" target="_blank" rel="noopener noreferrer" className="inline-flex items-center gap-2 hover:text-[var(--oro)]">
                <MessageCircle className="h-3.5 w-3.5" /> +58 416 4242274
              </a>
            </li>
            <li className="pt-2 text-xs text-white/50">Versión de marca 1.3 · 2026</li>
          </ul>
        </div>
      </div>
      <div className="mx-auto mt-12 max-w-7xl border-t border-white/10 px-6 pt-6 text-xs text-white/50">
        © {new Date().getFullYear()} Puro Llano Radio. Todos los derechos reservados.
      </div>
    </footer>
  );
}
