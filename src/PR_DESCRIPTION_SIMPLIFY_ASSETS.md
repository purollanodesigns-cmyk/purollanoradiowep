# PR: chore(assets): centralizar rutas de logo y hero y usar constantes en componentes

Resumen
- Centraliza las rutas/URLs de los assets en src/lib/assets.ts y actualiza los componentes para usar esas constantes (LOGO, HERO). Evita mezclar imports de asset.json y de la imagen directa, facilitando cambios futuros en la ubicación/servicio de assets.

Cambios principales
- Añadido src/lib/assets.ts exportando LOGO y HERO (elige asset.url si existe, o la URL importada del PNG).
- Reemplazados imports/uso del logo en Footer, SiteMenu, FloatingPlayer y routes/index para leer LOGO/HERO desde src/lib/assets.ts.
- Mejora la coherencia entre usos de asset.json y de imports directos de imágenes.

Checklist de verificación (antes de merge)
- [ ] Header: logo correcto en cabecera y drawer (desktop + móvil).
- [ ] Hero: imagen de portada carga correctamente y <link rel="preload"> apunta a HERO.
- [ ] FloatingPlayer: artwork muestra meta.artwork y, si no, usa LOGO como fallback; Media Session metadata muestra la imagen correcta.
- [ ] No quedan referencias antiguas a purollano-logo o logo.url en el repo.
- [ ] La build TypeScript no muestra errores por importar *.asset.json o imágenes (si aparece error, castear en assets.ts o añadir declaración de tipos).
- [ ] Probar en dev: npm run dev y recorrido visual (header, hero, reproductor)

Notas
- Si el build marca errores de tipos por importar *.asset.json o imágenes, se puede corregir añadiendo declaraciones de tipos en src/types.d.ts o casteando como any en src/lib/assets.ts.
