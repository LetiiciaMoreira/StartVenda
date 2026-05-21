/**
 * ESSA FUNCAO VERIFICA SE O USUARIO ESTA AUTENTICADO E SE OS DADOS DO LOCALSTORAGE CORRESPONDEM AOS DADOS DO USUARIO NA API.
 */
async function getUsuarioAutenticadoSeguro() {
    const usuarioLS = localStorage.getItem('usuario');
    if (!usuarioLS) return null;
    let usuario;
    try {
        usuario = JSON.parse(usuarioLS);
    } catch {
        return null;
    }
    if (!usuario?.id) return null;

    const resp = await fetch(`http://localhost:3000/usuarios/${usuario.id}`);
    if (!resp.ok) return null;
    const usuarioAPI = await resp.json();

    const campos = ['id', 'login', 'email', 'nome'];
    for (const campo of campos) {
        if (usuario[campo] !== usuarioAPI[campo]) return null;
    }

    return usuario.id;
}