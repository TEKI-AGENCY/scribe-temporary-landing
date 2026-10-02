# Scribe — landing temporal + contingencia SEO

Paquete estático listo para continuar desarrollo y desplegar en Railway con nginx.

## Qué se preservó

La home (`public/index.html`) y sus assets provienen **directamente del build estático compartido** en `temporary-landing.zip`. No se reconstruyó su markup ni su animación.

## Qué se agregó

- 12 páginas internas temporales con contenido SEO mínimo y estilos base alineados al landing actual.
- Placeholder de imagen en `public/assets/placeholder.webp`.
- CSS exclusivo para internas en `public/assets/internal.css`.
- `robots.txt` y `sitemap.xml`.
- `nginx/default.conf.template` + `nginx/redirects.map` con el mapa de contingencia SEO.
- Dockerfile para Railway/nginx.
- 404 estático con la misma base visual.

## Internas

- `/cuadernos/`
- `/moda-y-accesorios/`
- `/arte-y-escritura/`
- `/licencias/`
- `/incolors/`
- `/blog/`
- `/ventas-corporativas/`
- `/contacto/`
- `/garantias/`
- `/tratamiento-de-datos/`
- `/pqr/`
- `/terminos-y-condiciones/`

## Desarrollo visual

Para avanzar sobre las internas, el archivo principal es:

`public/assets/internal.css`

Cada interna es HTML estático independiente. El placeholder puede reemplazarse directamente en su `<figure class="internal-media">`.

## Deploy

El `Dockerfile` copia `public/` directamente a nginx. No requiere ejecutar Vite en producción.

Railway inyecta `$PORT`; la imagen oficial de nginx renderiza `nginx/default.conf.template` al iniciar.
