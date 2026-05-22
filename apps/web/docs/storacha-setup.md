# Storacha (IPFS) — setup de credenciales

Molotov sube las imágenes y la metadata de cada obra a IPFS vía
[Storacha](https://storacha.network) (sucesor moderno de nft.storage / web3.storage,
mantenido por Protocol Labs). Free tier de 5 GiB.

El upload corre **server-side** (`apps/web/app/api/ipfs/upload/route.ts`); las
credenciales nunca llegan al browser. Storacha usa **UCAN** en vez de una API
key simple: hay que crear un *space*, generar una *agent key* y delegarle
permiso con una *delegation* (proof). Necesitás dos valores en `.env.local`:

| Variable | Qué es |
|---|---|
| `STORACHA_KEY` | Clave privada del agente. Empieza con `Mg...`. |
| `STORACHA_PROOF` | Delegation UCAN en base64 que autoriza a ese agente sobre el space. |

> Doc oficial usada de referencia: <https://docs.storacha.network/how-to/upload/>
> (sección de upload server-side / CI). La API de Storacha cambió varias veces;
> si algún comando difiere, mandá la doc actual.

## Pasos

1. **Crear cuenta** en <https://storacha.network>.

2. **Instalar la CLI** (global):
   ```bash
   npm install -g @storacha/cli
   ```

3. **Login** (te llega un mail con un link de validación, hacé click):
   ```bash
   storacha login tu-email@example.com
   ```

4. **Crear el space** y dejarlo como activo:
   ```bash
   storacha space create molotov-dev
   ```
   Guardá la recovery phrase que te muestra. Anotá el DID del space
   (`did:key:z...`); si necesitás re-seleccionarlo después:
   ```bash
   storacha space ls          # lista spaces con sus DIDs
   storacha space use <space_did>
   ```

5. **Generar la agent key** (esta es la identidad que va a usar el servidor):
   ```bash
   storacha key create
   ```
   Imprime dos cosas:
   - una línea comentada con el **DID del agente** (`# did:key:z...`),
   - la **clave privada** (`Mg...`).

   La clave privada `Mg...` → `STORACHA_KEY`.

6. **Crear la delegation** del space hacia ese agent DID, con los permisos que
   `uploadFile` necesita:
   ```bash
   storacha delegation create <agent_did_del_paso_5> --base64 \
     --can space/blob/add \
     --can space/index/add \
     --can filecoin/offer \
     --can upload/add
   ```
   La salida es un string base64 → `STORACHA_PROOF`.

7. **Guardar en `apps/web/.env.local`** (este archivo está gitignored):
   ```bash
   STORACHA_KEY=Mg...
   STORACHA_PROOF=<base64-del-paso-6>
   ```

8. **Reiniciar el dev/prod server** para que tome las variables, y probar:
   - Conectá Freighter en testnet, andá a `/crear`, subí una imagen y minteá.
   - Si el upload falla, mirá la consola del server: el route handler loguea el
     error real (`[ipfs/upload]`); en pantalla el usuario ve un mensaje editorial.

## Notas

- `STORACHA_KEY` y `STORACHA_PROOF` son secretos: no los commitees. Sólo el
  `.env.example` (con placeholders vacíos) va al repo.
- La gateway URL que devuelve el route handler es
  `https://<cid>.ipfs.w3s.link`.
- Si rotás la agent key, regenerá también la delegation (el proof está atado al
  DID del agente).
