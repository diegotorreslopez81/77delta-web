// Spec 8: franja "¿Recordar este dispositivo?" al entrar por enlace con token. La decisión es una función pura
// (con test); el DOM y el guardado quedan en franjaRecordar().
export const decidirFranja = ({ porEnlace, recordado, otro, descartada, clave, arg }) => {
  if (!porEnlace || recordado || descartada) return null;
  // Ni en #secreto ni con una tarjeta de Hoy abierta (#hoy/N): no tapar el valor del secreto ni sus botones.
  if (clave === 'secreto' || (clave === 'hoy' && arg)) return null;
  return { texto: otro ? 'Actualizar el dispositivo con este acceso' : '¿Recordar este dispositivo? Así no tendrás que pegar el enlace otra vez.' };
};
const MARCA = 'hq_recordar_no';
const leerNo = () => { try { return sessionStorage.getItem(MARCA) === '1'; } catch { return false; } };
const ponerNo = () => { try { sessionStorage.setItem(MARCA, '1'); } catch { /* solo esta vista */ } };
let hecho = false;
export function franjaRecordar({ porEnlace, recordado, otro, clave, arg, token, guardar, el, toast }) {
  const viva = document.getElementById('franja-recordar');
  const d = hecho ? null : decidirFranja({ porEnlace, recordado, otro, descartada: leerNo(), clave, arg });
  if (!d) { if (viva) viva.remove(); return; }
  if (viva) return;
  const cerrar = () => document.getElementById('franja-recordar')?.remove();
  document.body.append(el('div', { id: 'franja-recordar', class: 'franja-recordar', role: 'region', 'aria-label': 'Recordar dispositivo' }, [
    el('span', { text: d.texto }),
    el('button', { class: 'btn primario', text: 'Recordar', onclick: () => { guardar(token, true); hecho = true; cerrar(); toast('Dispositivo recordado', null, null, 2000); } }),
    el('button', { class: 'btn', text: 'Esta vez no', onclick: () => { ponerNo(); cerrar(); } })]));
}
