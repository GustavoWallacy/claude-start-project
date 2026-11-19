const projetos = [{ nome: 'Loja', url: 'https://example.com' }];
export function Projetos() { return <ul>{projetos.map((p) => <li key={p.nome}><a href={p.url}>{p.nome}</a></li>)}</ul>; }
