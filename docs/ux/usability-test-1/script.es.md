# Prueba de usabilidad 1 — guion del moderador (español)

> Spanish version of the [moderator script](script.md), the one read aloud in the sessions. Both say
> the same; the English one is the reference for the repository.

## Antes de la sesión

- El prototipo abierto en el commit que nombra el informe; los datos de demo reiniciados (abrir su
  enlace con `?reset` una vez).
- La videollamada lista: compartir pantalla, grabación apagada hasta tener el consentimiento.
- La fila del participante lista en [data/tasks.csv](data/tasks.csv); un cronómetro.
- Las tarjetas de tarea listas para pegar en el chat, una por una.

## Filtro de reclutamiento

Se pregunta al reclutar; el participante necesita "sí" en 1–3 y "no" en 4.

1. ¿Trabajas o has trabajado en ventas, compras o administración de una empresa que vende a otras
   empresas (cotizaciones, pedidos, facturas)?
2. ¿Usas aplicaciones web en el trabajo al menos una vez por semana?
3. ¿Puedes leer una interfaz sencilla en inglés (botones, menús, nombres de productos)?
4. ¿Has visto o ayudado a construir Pricewright?

## Introducción (5 minutos)

> Gracias por participar. Estoy probando un producto llamado Pricewright, una herramienta que usan
> los distribuidores para calcular precios y enviar cotizaciones a sus clientes empresariales. Estoy
> probando el producto, no a ti: no hay respuestas incorrectas, y si algo cuesta, es algo que
> tenemos que arreglar.
>
> Te voy a dar algunas tareas. Mientras trabajas, por favor piensa en voz alta: di qué buscas, qué
> esperas y qué te sorprende. Puede que no responda preguntas durante una tarea, porque quiero ver
> qué harías por tu cuenta; las respondo al final.
>
> Es un prototipo: algunos botones pueden no hacer nada. Si pasa, dime qué esperabas.
>
> ¿Puedo grabar la pantalla y el audio? Solo yo veré la grabación, se borra después del análisis, y
> nada que te identifique aparece en los resultados. Puedes parar cuando quieras.

Anotar la respuesta de consentimiento en la planilla antes de seguir.

Calentamiento: "¿Cuál es tu rol, o el más parecido que hayas tenido? ¿Cómo preparan hoy las
cotizaciones tú o tu empresa?"

## Tareas (25 minutos)

En cada tarea: pegar la tarjeta, dejar que el participante la lea, iniciar el cronómetro cuando
termine de leer y detenerlo cuando diga que terminó o que se rinde. Luego preguntar la SEQ
([cuestionarios](questionnaires.md)).

**Reglas para el moderador:**

- Solo preguntas neutrales: "¿Qué estás pensando?", "¿Qué esperas que pase?", "¿Qué estás buscando?"
- No ayudar salvo que el participante pregunte dos veces o lleve 2 minutos trabado; entonces dar la
  pista más pequeña y marcar la tarea como `assisted`.
- Anotar los errores en el momento (producto equivocado, cantidad equivocada, acción equivocada) y
  si el participante se recuperó.

### Tarea 1 — buscar un cliente

> Eres Taylor Brooks, vendedor o vendedora de Northfield Supply. Te llama un cliente, Stonegate
> Storage Centers. Antes de cotizar, revisa qué condiciones de pago tiene.

Éxito: dice "Net 60" o "60 días".

### Tarea 2 — armar y enviar a aprobar una cotización

> Stonegate quiere una cotización de estos productos. Ármala y envíala (Submit).

| SKU      | Producto                                                          | Cantidad |
| -------- | ----------------------------------------------------------------- | -------- |
| FST-0063 | Zinc-Plated Sleeve Anchor, 1/2 x 3-3/4 in, Box of 25              | 60       |
| OFP-0036 | File Folders, Letter, Straight-Cut Tab, Manila, Box of 100        | 12       |
| SAF-0936 | Nitrile Disposable Gloves, 4 mil, Powder-Free, Medium, Box of 100 | 48       |
| JAN-0979 | Trash Can Liners, 55-60 gal, 1.2 mil, Black, Case of 100          | 20       |
| SAF-0829 | Safety Glasses, Indoor/Outdoor Mirror Lens, Anti-Fog, ANSI Z87.1+ | 100      |

Los participantes impares (P1, P3, P5) ven la columna SKU solo en las tres primeras líneas; los
pares (P2, P4), solo en las dos últimas. Las demás líneas muestran solo el nombre del producto.

Éxito: cinco líneas con los productos y cantidades correctos, y la cotización enviada. Después de la
tarea: "¿Qué pasa ahora con esta cotización?" (P3 del plan).

### Tarea 3 — explicar un precio

> El comprador de Stonegate pregunta por qué los anclajes (sleeve anchors) cuestan 42.38 y no el
> precio de lista, 51.23. ¿Qué le dices?

Éxito: menciona el descuento por volumen (50 cajas o más) y el descuento de cuenta gold.

### Tarea 4 — decidir desde el teléfono

Pedir al participante que abra el enlace del prototipo en su teléfono y comparta esa pantalla.

> Ahora eres Morgan Reyes, gerente de ventas, entre dos visitas a clientes. Varias cotizaciones
> esperan tu aprobación. Aprueba la de Stonegate. Rechaza la de Kestrel Bay NF-2026-000140, que
> descuenta más del 15% que permites, y dile al vendedor qué cambiar.

Éxito: NF-2026-000132 de Stonegate aprobada; NF-2026-000140 rechazada con un comentario que pide un
descuento menor. Hay otra cotización de Kestrel Bay pendiente: decidir sobre esa es un error.

### Tarea 5 — enviar la cotización aprobada

De vuelta en la computadora, como Taylor. Pegar en el chat el enlace de moderador (la dirección del
prototipo terminada en `#/moderator/approve-latest`): al abrirlo, Morgan aprueba la cotización de la
tarea 2, como si el participante hubiera esperado la decisión.

> Morgan aprobó tu cotización para Stonegate. Envíala al cliente. ¿Quién la recibió?

Éxito: la envía y nombra el correo de compras de Stonegate.

## Cuestionario (5 minutos)

El SUS en español ([cuestionarios](questionnaires.md)), respondido a solas; revisar que todos los
ítems tengan respuesta.

## Cierre (5 minutos)

1. ¿Qué fue lo más difícil? ¿Y lo más fácil?
2. ¿Algo fue distinto de lo que esperabas?
3. Si usaras esto todos los días, ¿qué cambiarías primero?
4. (Responder las preguntas que el participante hizo durante las tareas.)

> Gracias. Tu ayuda cambia lo que construimos después.

## Después de la sesión

Completar el mismo día las filas del participante en [data/tasks.csv](data/tasks.csv) y
[data/sus.csv](data/sus.csv), y sus notas en `data/observations.md`.
