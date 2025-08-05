# Astro with Tailwind

```sh
pnpm create astro@latest -- --template with-tailwindcss
```

[![Open in StackBlitz](https://developer.stackblitz.com/img/open_in_stackblitz.svg)](https://stackblitz.com/github/withastro/astro/tree/latest/examples/with-tailwindcss)
[![Open with CodeSandbox](https://assets.codesandbox.io/github/button-edit-lime.svg)](https://codesandbox.io/p/sandbox/github/withastro/astro/tree/latest/examples/with-tailwindcss)
[![Open in GitHub Codespaces](https://github.com/codespaces/badge.svg)](https://codespaces.new/withastro/astro?devcontainer_path=.devcontainer/with-tailwindcss/devcontainer.json)

Astro comes with [Tailwind](https://tailwindcss.com) support out of the box. This example showcases how to style your
Astro project with Tailwind.

For complete setup instructions, please see
our [Tailwind Integration Guide](https://docs.astro.build/en/guides/integrations-guide/tailwind).

te voy a decir todo el flujo por que va a pasar el usuario y de ahi saca los estados por los que deberia de sacar el
usuario para sacar los mensaje que corresponden:

Recien creado el grupo deberia de salir un mensaje en plan faltan x usuarios para poder realizar el pedido, por que hara
falta un minimo de 25 personas para poder realizar un pedido, una vez el minimo de personas se haya añadido al grupo
puede ocurrir que alomejor por ejemplo 3 de las 25 no esten bien completadas (por que falte por ejemplo la imagen
necesaria de la persona) en ese caso deberia de salir como que 3 personas faltan por ser completadas para poder realizar
el pedido, alfinal hacen falta 25 usuarios bien completados para realizar el pedido, una vez eso este bien deberia de
salir algo asi como que esta bien pendiente de que el pague para realizar el pedido, en el momento que pague deberia de
cambiar algo asi de que el pedido esta en proceso, por que en ese momento nosotros tendremos que coger persona por
persona y seleccionar las piezas de lego adecuadas para que el lego final se parezca a la persona de la foto, una vez
nosotros seleccionemos todas las piezas de todos, se mandaria un email al usuario que hizo el pedido para avisarle de
que ya esta que tiene que entrar a la pagina para validar que las piezas seleccionadas le parecen bien, una vez el
usuario da el OK nosotros realizamos el pedido de dichas piezas a la tienda de lego pudiendo faltar por falta de stock
de lego que no controlamos alguna de las piezas seleccionadas, en ese caso nosotros seleccionariamos otra pieza lo mas
parecida posible y realizariamos el pedido, una vez llegara el pedido entraria en "revision" tenemos que ver que lego
nos ha mandado todas las piezas solicitadas y que no falta ninguna, en caso de que faltara alguna reclamariamos a lego,
una vez tubieramos todas las piezas pasariamos a montaje, montamos los lego de cada persona para ponerlos en su
bolsa/caja y una vez terminado realizariamos el envio al cliente ya con sus legos preparados