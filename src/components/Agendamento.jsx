import React, { useState, useEffect, useRef } from 'react';
import { initializeApp } from 'firebase/app';
import { getFirestore, collection, addDoc, getDocs, onSnapshot, doc, updateDoc, deleteDoc, query, where } from 'firebase/firestore';
import { getAuth, signInAnonymously, onAuthStateChanged, signInWithEmailAndPassword, signOut } from 'firebase/auth';

// --- A sua Configuração do Firebase ---
const firebaseConfig = {
    apiKey: "AIzaSyDa3jWNZTaRqrJ0ga_mjUlofD2LsXvKu1A",
    authDomain: "barbershop-2d4e8.firebaseapp.com",
    projectId: "barbershop-2d4e8",
    storageBucket: "barbershop-2d4e8.appspot.com",
    messagingSenderId: "99266137079",
    appId: "1:99266137079:web:5688796ad879bfee39bcf2",
};

// --- Ícones e Componentes Auxiliares ---
const CalendarIcon = () => (<svg xmlns="http://www.w3.org/2000/svg" className="h-5 w-5 mr-2 text-gray-500" viewBox="0 0 20 20" fill="currentColor"> <path fillRule="evenodd" d="M6 2a1 1 0 00-1 1v1H4a2 2 0 00-2 2v10a2 2 0 002 2h12a2 2 0 002-2V6a2 2 0 00-2-2h-1V3a1 1 0 10-2 0v1H7V3a1 1 0 00-1-1zm0 5a1 1 0 000 2h8a1 1 0 100-2H6z" clipRule="evenodd" /> </svg>);
const SpinnerIcon = () => (<svg className="animate-spin -ml-1 mr-3 h-5 w-5 text-white" xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24"> <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4"></circle> <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z"></path> </svg>);
const FeedbackMessage = ({ message, type }) => { if (!message) return null; const baseClasses = "text-center p-3 rounded-lg my-4"; const typeClasses = type === 'success' ? "bg-green-800 text-green-200 border border-green-600" : "bg-red-800 text-red-200 border border-red-600"; return <div className={`${baseClasses} ${typeClasses}`}>{message}</div>; };
const KebabIcon = () => (<svg xmlns="http://www.w3.org/2000/svg" className="h-6 w-6" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}> <path strokeLinecap="round" strokeLinejoin="round" d="M12 5v.01M12 12v.01M12 19v.01M12 6a1 1 0 110-2 1 1 0 010 2zm0 7a1 1 0 110-2 1 1 0 010 2zm0 7a1 1 0 110-2 1 1 0 010 2z" /> </svg>);

// --- Componente do Painel Financeiro ---
function FinancialPanel({ db }) {
    const [agendamentos, setAgendamentos] = useState([]);
    const [barbeiros, setBarbeiros] = useState([]);
    const [loading, setLoading] = useState(true);
    
    const [currentMonth, setCurrentMonth] = useState(new Date().getMonth());
    const [currentYear, setCurrentYear] = useState(new Date().getFullYear());
    const [selectedBarberId, setSelectedBarberId] = useState('todos');
    const [currentPage, setCurrentPage] = useState(1);
    const ITEMS_PER_PAGE = 10;

    useEffect(() => {
        if (!db) return;
        setLoading(true);

        const qAgendamentos = query(collection(db, 'agendamentos'), where("status", "==", "Concluído"));
        const agendamentosUnsub = onSnapshot(qAgendamentos, (querySnapshot) => {
            const agendamentosData = querySnapshot.docs.map(doc => ({
                id: doc.id,
                ...doc.data(),
                dataObj: new Date(doc.data().data + 'T00:00:00')
            }));
            setAgendamentos(agendamentosData);
        });

        const barbeirosUnsub = onSnapshot(collection(db, 'barbeiros'), (querySnapshot) => {
            setBarbeiros(querySnapshot.docs.map(doc => ({ id: doc.id, ...doc.data() })));
        });

        setLoading(false);
        return () => { agendamentosUnsub(); barbeirosUnsub(); };
    }, [db]);
    
    useEffect(() => {
        setCurrentPage(1);
    }, [currentMonth, currentYear, selectedBarberId]);

    const agendamentosFiltrados = agendamentos.filter(ag => {
        const matchData = ag.dataObj.getMonth() === currentMonth && ag.dataObj.getFullYear() === currentYear;
        const matchBarbeiro = selectedBarberId === 'todos' || ag.barbeiroId === selectedBarberId;
        return matchData && matchBarbeiro;
    });

    const faturamentoTotal = agendamentosFiltrados.reduce((acc, ag) => acc + (ag.valor || 0), 0);
    const servicosConcluidos = agendamentosFiltrados.length;
    const ticketMedio = servicosConcluidos > 0 ? faturamentoTotal / servicosConcluidos : 0;
    
    const totalPages = Math.ceil(agendamentosFiltrados.length / ITEMS_PER_PAGE);
    const paginatedAgendamentos = agendamentosFiltrados.slice((currentPage - 1) * ITEMS_PER_PAGE, currentPage * ITEMS_PER_PAGE);

    const meses = ["Janeiro", "Fevereiro", "Março", "Abril", "Maio", "Junho", "Julho", "Agosto", "Setembro", "Outubro", "Novembro", "Dezembro"];
    const anosDisponiveis = Array.from({ length: 5 }, (_, i) => new Date().getFullYear() - i);

    return (
        <div className="w-full max-w-6xl bg-gray-800 rounded-2xl shadow-2xl p-8 space-y-8">
            <h1 className="text-3xl font-bold text-white text-center">Painel Financeiro</h1>
            
            <div className="flex flex-wrap justify-center items-center gap-4 bg-gray-700 p-3 rounded-lg">
                <select value={currentMonth} onChange={(e) => setCurrentMonth(Number(e.target.value))} className="bg-gray-600 text-white p-2 rounded-md focus:outline-none">{meses.map((mes, index) => <option key={index} value={index}>{mes}</option>)}</select>
                <select value={currentYear} onChange={(e) => setCurrentYear(Number(e.target.value))} className="bg-gray-600 text-white p-2 rounded-md focus:outline-none">{anosDisponiveis.map(ano => <option key={ano} value={ano}>{ano}</option>)}</select>
                <select value={selectedBarberId} onChange={(e) => setSelectedBarberId(e.target.value)} className="bg-gray-600 text-white p-2 rounded-md focus:outline-none"><option value="todos">Todos os Barbeiros</option>{barbeiros.map(barbeiro => <option key={barbeiro.id} value={barbeiro.id}>{barbeiro.nome}</option>)}</select>
            </div>

            {loading ? <div className="flex justify-center"><SpinnerIcon/></div> : (
                <>
                    <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
                        <div className="bg-gray-700 p-6 rounded-lg text-center"><p className="text-sm text-gray-400">Faturamento Total</p><p className="text-3xl font-bold text-green-400">R$ {faturamentoTotal.toFixed(2).replace('.', ',')}</p></div>
                        <div className="bg-gray-700 p-6 rounded-lg text-center"><p className="text-sm text-gray-400">Serviços Concluídos</p><p className="text-3xl font-bold text-white">{servicosConcluidos}</p></div>
                        <div className="bg-gray-700 p-6 rounded-lg text-center"><p className="text-sm text-gray-400">Ticket Médio</p><p className="text-3xl font-bold text-white">R$ {ticketMedio.toFixed(2).replace('.', ',')}</p></div>
                    </div>
                    <div className="overflow-x-auto no-scrollbar">
                        <h2 className="text-xl font-semibold text-white mb-4">Detalhes dos Serviços Concluídos</h2>
                        {paginatedAgendamentos.length === 0 ? (<p className="text-center text-gray-400 bg-gray-700 p-4 rounded-lg">Nenhum serviço concluído neste período.</p>) : (
                             <table className="min-w-full text-sm text-left text-gray-300">
                                <thead className="bg-gray-700 text-xs uppercase"><tr><th className="px-6 py-3">Data</th><th className="px-6 py-3">Cliente</th><th className="px-6 py-3">Barbeiro</th><th className="px-6 py-3">Serviço</th><th className="px-6 py-3 text-right">Valor</th></tr></thead>
                                <tbody>{paginatedAgendamentos.map(ag => (<tr key={ag.id} className="bg-gray-800 border-b border-gray-700 hover:bg-gray-600"><td className="px-6 py-4">{ag.dataObj.toLocaleDateString()}</td><td className="px-6 py-4 font-medium text-white">{ag.cliente.nome}</td><td className="px-6 py-4">{ag.barbeiroNome}</td><td className="px-6 py-4">{ag.servico}</td><td className="px-6 py-4 text-right font-semibold text-green-400">R$ {ag.valor.toFixed(2).replace('.', ',')}</td></tr>))}</tbody>
                            </table>
                        )}
                        {totalPages > 1 && (<div className="flex justify-between items-center mt-4"><button onClick={() => setCurrentPage(p => Math.max(p - 1, 1))} disabled={currentPage === 1} className="px-4 py-2 bg-gray-600 rounded-md disabled:opacity-50">Anterior</button><span>Página {currentPage} de {totalPages}</span><button onClick={() => setCurrentPage(p => Math.min(p + 1, totalPages))} disabled={currentPage === totalPages} className="px-4 py-2 bg-gray-600 rounded-md disabled:opacity-50">Próxima</button></div>)}
                    </div>
                </>
            )}
        </div>
    );
}

// --- Componente do Painel de Login ---
function LoginPanel({ auth, showFeedback }) {
    const [email, setEmail] = useState('');
    const [password, setPassword] = useState('');
    const [loading, setLoading] = useState(false);

    const handleLogin = async (e) => {
        e.preventDefault();
        setLoading(true);
        try {
            await signInWithEmailAndPassword(auth, email, password);
        } catch (error) {
            showFeedback('Email ou senha inválidos.', 'error');
            console.error("Erro de login:", error);
        } finally {
            setLoading(false);
        }
    };

    return (
        <div className="w-full max-w-sm bg-gray-800 rounded-2xl shadow-2xl p-8 space-y-6">
            <h1 className="text-3xl font-bold text-white text-center">Acesso Administrativo</h1>
            <form onSubmit={handleLogin} className="space-y-4">
                <div><label className="block text-sm font-medium text-gray-300 mb-1">Email</label><input type="email" value={email} onChange={(e) => setEmail(e.target.value)} className="w-full px-4 py-3 bg-gray-700 text-white rounded-lg focus:outline-none" required /></div>
                <div><label className="block text-sm font-medium text-gray-300 mb-1">Senha</label><input type="password" value={password} onChange={(e) => setPassword(e.target.value)} className="w-full px-4 py-3 bg-gray-700 text-white rounded-lg focus:outline-none" required /></div>
                <button type="submit" disabled={loading} className="w-full flex justify-center py-3 bg-blue-600 hover:bg-blue-700 text-white font-bold rounded-lg">{loading ? <SpinnerIcon /> : 'Entrar'}</button>
            </form>
        </div>
    );
}

// --- Componente do Painel de Configurações ---
function ConfigPanel({ db }) {
    const [servicos, setServicos] = useState([]);
    const [barbeiros, setBarbeiros] = useState([]);
    const [loading, setLoading] = useState(true);
    const [feedback, setFeedback] = useState({ message: '', type: '' });
    
    const [novoServicoNome, setNovoServicoNome] = useState('');
    const [novoServicoPreco, setNovoServicoPreco] = useState('');
    const [novoBarbeiroNome, setNovoBarbeiroNome] = useState('');

    useEffect(() => {
        if (!db) return;
        const servicosUnsub = onSnapshot(collection(db, 'servicos'), (snap) => setServicos(snap.docs.map(d => ({ id: d.id, ...d.data() }))));
        const barbeirosUnsub = onSnapshot(collection(db, 'barbeiros'), (snap) => {
            setBarbeiros(snap.docs.map(d => ({ id: d.id, ...d.data() })));
            setLoading(false);
        });
        return () => { servicosUnsub(); barbeirosUnsub(); };
    }, [db]);

    const showFeedback = (message, type) => {
        setFeedback({ message, type });
        setTimeout(() => setFeedback({ message: '', type: '' }), 3000);
    };

    const handleAdicionarServico = async (e) => {
        e.preventDefault();
        if (!novoServicoNome || novoServicoPreco <= 0) { showFeedback('Preencha nome e preço válido.', 'error'); return; }
        try {
            await addDoc(collection(db, 'servicos'), { nome: novoServicoNome, preco: Number(novoServicoPreco) });
            showFeedback('Serviço adicionado!', 'success');
            setNovoServicoNome(''); setNovoServicoPreco('');
        } catch (error) { showFeedback('Erro ao adicionar serviço.', 'error'); }
    };

    const handleExcluirServico = async (id) => {
        if (window.confirm('Tem certeza?')) {
            try { await deleteDoc(doc(db, 'servicos', id)); showFeedback('Serviço excluído!', 'success'); } 
            catch (error) { showFeedback('Erro ao excluir serviço.', 'error'); }
        }
    };
    
    const handleAdicionarBarbeiro = async (e) => {
        e.preventDefault();
        if (!novoBarbeiroNome) { showFeedback('Insira o nome do barbeiro.', 'error'); return; }
        try {
            await addDoc(collection(db, 'barbeiros'), { nome: novoBarbeiroNome });
            showFeedback('Barbeiro adicionado!', 'success');
            setNovoBarbeiroNome('');
        } catch (error) { showFeedback('Erro ao adicionar barbeiro.', 'error'); }
    };

    const handleExcluirBarbeiro = async (id) => {
        if (window.confirm('Tem certeza?')) {
            try { await deleteDoc(doc(db, 'barbeiros', id)); showFeedback('Barbeiro excluído!', 'success'); } 
            catch (error) { showFeedback('Erro ao excluir barbeiro.', 'error'); }
        }
    };

    return (
        <div className="w-full max-w-4xl bg-gray-800 rounded-2xl shadow-2xl p-8 space-y-8">
            <h1 className="text-3xl font-bold text-white text-center">Painel de Configurações</h1>
            <FeedbackMessage message={feedback.message} type={feedback.type} />
            <div className="grid grid-cols-1 md:grid-cols-2 gap-8">
                <div>
                    <h2 className="text-xl font-semibold text-white mb-4 border-b border-gray-700 pb-2">Gerenciar Serviços</h2>
                    <form onSubmit={handleAdicionarServico} className="bg-gray-700 p-4 rounded-lg flex flex-col gap-4 mb-6">
                        <input type="text" value={novoServicoNome} onChange={(e) => setNovoServicoNome(e.target.value)} placeholder="Nome do Serviço" className="w-full px-4 py-2 bg-gray-600 text-white rounded-lg focus:outline-none"/>
                        <input type="number" value={novoServicoPreco} onChange={(e) => setNovoServicoPreco(e.target.value)} placeholder="Preço" className="w-full px-4 py-2 bg-gray-600 text-white rounded-lg focus:outline-none"/>
                        <button type="submit" className="px-6 py-2 bg-blue-600 hover:bg-blue-700 text-white font-bold rounded-lg">Adicionar Serviço</button>
                    </form>
                    <div className="space-y-3 h-48 overflow-y-auto no-scrollbar">{loading ? <p>Carregando...</p> : servicos.map(s => (<div key={s.id} className="bg-gray-700 p-3 rounded-lg flex justify-between items-center"><div><p className="font-semibold text-white">{s.nome}</p><p className="text-sm text-gray-300">R$ {s.preco.toFixed(2)}</p></div><button onClick={() => handleExcluirServico(s.id)} className="text-red-400 hover:text-red-300">Excluir</button></div>))}</div>
                </div>
                <div>
                    <h2 className="text-xl font-semibold text-white mb-4 border-b border-gray-700 pb-2">Gerenciar Barbeiros</h2>
                    <form onSubmit={handleAdicionarBarbeiro} className="bg-gray-700 p-4 rounded-lg flex flex-col gap-4 mb-6">
                        <input type="text" value={novoBarbeiroNome} onChange={(e) => setNovoBarbeiroNome(e.target.value)} placeholder="Nome do Barbeiro" className="w-full px-4 py-2 bg-gray-600 text-white rounded-lg focus:outline-none"/>
                        <button type="submit" className="px-6 py-2 bg-blue-600 hover:bg-blue-700 text-white font-bold rounded-lg">Adicionar Barbeiro</button>
                    </form>
                    <div className="space-y-3 h-48 overflow-y-auto no-scrollbar">{loading ? <p>Carregando...</p> : barbeiros.map(b => (<div key={b.id} className="bg-gray-700 p-3 rounded-lg flex justify-between items-center"><p className="font-semibold text-white">{b.nome}</p><button onClick={() => handleExcluirBarbeiro(b.id)} className="text-red-400 hover:text-red-300">Excluir</button></div>))}</div>
                </div>
            </div>
        </div>
    );
}

// --- Componente do Painel de Administrador ---
function AdminPanel({ db }) {
    const [agendamentos, setAgendamentos] = useState([]);
    const [loading, setLoading] = useState(true);
    const [openMenuId, setOpenMenuId] = useState(null);
    const [feedback, setFeedback] = useState({ message: '', type: '' });
    const menuRef = useRef(null);
    const [currentPage, setCurrentPage] = useState(1);
    const ITEMS_PER_PAGE = 10;

    useEffect(() => {
        if (!db) return;
        const agendamentosCollectionRef = collection(db, 'agendamentos');
        const unsubscribe = onSnapshot(agendamentosCollectionRef, (querySnapshot) => {
            const agendamentosData = querySnapshot.docs.map(doc => ({ id: doc.id, ...doc.data() }));
            agendamentosData.sort((a, b) => new Date(`${b.data}T${b.horario}`) - new Date(`${a.data}T${a.horario}`)); // Ordem decrescente
            setAgendamentos(agendamentosData);
            setLoading(false);
        });
        return () => unsubscribe();
    }, [db]);

    useEffect(() => {
        const handleClickOutside = (event) => {
            if (openMenuId && !event.target.closest('.action-menu-container')) {
                setOpenMenuId(null);
            }
        };
        document.addEventListener('mousedown', handleClickOutside);
        return () => document.removeEventListener('mousedown', handleClickOutside);
    }, [openMenuId]);

    const showFeedback = (message, type) => {
        setFeedback({ message, type });
        setTimeout(() => setFeedback({ message: '', type: '' }), 3000);
    };

    const handleUpdateStatus = async (id, status) => {
        try {
            await updateDoc(doc(db, 'agendamentos', id), { status });
            showFeedback(`Agendamento marcado como ${status}!`, 'success');
        } catch (error) { showFeedback('Erro ao atualizar status.', 'error'); }
    };

    const handleDelete = async (id) => {
        if (window.confirm("Tem certeza que deseja excluir? Esta ação não pode ser desfeita.")) {
            try {
                await deleteDoc(doc(db, 'agendamentos', id));
                showFeedback('Agendamento excluído com sucesso!', 'success');
            } catch (error) { showFeedback('Erro ao excluir agendamento.', 'error');}
        }
    };
    
    const totalPages = Math.ceil(agendamentos.length / ITEMS_PER_PAGE);
    const paginatedAgendamentos = agendamentos.slice((currentPage - 1) * ITEMS_PER_PAGE, currentPage * ITEMS_PER_PAGE);

    const getStatusClass = (status) => {
        switch (status) {
            case 'Concluído': return 'bg-green-900 text-green-300';
            case 'Cancelado': return 'bg-red-900 text-red-300';
            default: return 'bg-yellow-900 text-yellow-300';
        }
    };

    return (
        <div className="w-full max-w-6xl bg-gray-800 rounded-2xl shadow-2xl p-8 space-y-6">
            <h1 className="text-3xl font-bold text-white text-center">Painel de Agendamentos</h1>
            <FeedbackMessage message={feedback.message} type={feedback.type} />
            <div className="overflow-x-auto no-scrollbar">
                {loading ? (<p className="text-center text-gray-300">Carregando...</p>
                ) : paginatedAgendamentos.length === 0 ? (<p className="text-center text-gray-400 bg-gray-700 p-4 rounded-lg">Nenhum agendamento encontrado.</p>
                ) : (
                    <table className="min-w-full text-sm text-left text-gray-300">
                        <thead className="bg-gray-700 text-xs uppercase"><tr><th className="px-6 py-3">Data</th><th className="px-6 py-3">Hora</th><th className="px-6 py-3">Cliente</th><th className="px-6 py-3">Barbeiro</th><th className="px-6 py-3">Serviço</th><th className="px-6 py-3">Contato</th><th className="px-6 py-3 text-center">Status</th><th className="px-6 py-3 text-center">Ações</th></tr></thead>
                        <tbody>
                            {paginatedAgendamentos.map(ag => (
                                <tr key={ag.id} className="bg-gray-800 border-b border-gray-700 hover:bg-gray-600">
                                    <td className="px-6 py-4">{new Date(ag.data + 'T00:00:00').toLocaleDateString()}</td>
                                    <td className="px-6 py-4">{ag.horario}</td>
                                    <td className="px-6 py-4 font-medium text-white">{ag.cliente.nome}</td>
                                    <td className="px-6 py-4">{ag.barbeiroNome}</td>
                                    <td className="px-6 py-4">{ag.servico}</td>
                                    <td className="px-6 py-4">{ag.cliente.telefone}</td>
                                    <td className="px-6 py-4 text-center"><span className={`text-xs font-medium px-2.5 py-0.5 rounded-full ${getStatusClass(ag.status)}`}>{ag.status}</span></td>
                                    <td className="px-6 py-4 text-center">
                                        <div className="relative inline-block text-left action-menu-container">
                                            <button onClick={() => { const novoId = openMenuId === ag.id ? null : ag.id; setOpenMenuId(novoId); if (novoId) { setTimeout(() => { const menu = document.getElementById(`menu-${ag.id}`); if (menu) { menu.scrollIntoView({ behavior: "smooth", block: "nearest" }); } }, 50); } }} className="p-2 rounded-full hover:bg-gray-700"><KebabIcon /></button>
                                            {openMenuId === ag.id && (<div id={`menu-${ag.id}`} ref={menuRef} className="origin-top-right absolute right-0 mt-2 w-48 rounded-md shadow-lg bg-gray-700 ring-1 ring-black ring-opacity-5 z-10"><a href="#" onClick={(e) => { e.preventDefault(); handleUpdateStatus(ag.id, 'Concluído'); setOpenMenuId(null); }} className="block w-full text-left px-4 py-2 text-sm text-green-400 hover:bg-gray-600">Concluir</a><a href="#" onClick={(e) => { e.preventDefault(); handleUpdateStatus(ag.id, 'Cancelado'); setOpenMenuId(null); }} className="block w-full text-left px-4 py-2 text-sm text-red-400 hover:bg-gray-600">Cancelar</a><a href="#" onClick={(e) => { e.preventDefault(); handleDelete(ag.id); setOpenMenuId(null); }} className="block w-full text-left px-4 py-2 text-sm text-gray-300 hover:bg-gray-600">Excluir</a></div>)}
                                        </div>
                                    </td>
                                </tr>
                            ))}
                        </tbody>
                    </table>
                )}
                {totalPages > 1 && (<div className="flex justify-between items-center mt-4"><button onClick={() => setCurrentPage(p => Math.max(p - 1, 1))} disabled={currentPage === 1} className="px-4 py-2 bg-gray-600 rounded-md disabled:opacity-50">Anterior</button><span>Página {currentPage} de {totalPages}</span><button onClick={() => setCurrentPage(p => Math.min(p + 1, totalPages))} disabled={currentPage === totalPages} className="px-4 py-2 bg-gray-600 rounded-md disabled:opacity-50">Próxima</button></div>)}
            </div>
        </div>
    );
}

// --- Componente do Formulário de Agendamento ---
function AgendamentoForm({ db }) {
    const [servico, setServico] = useState('');
    const [data, setData] = useState('');
    const [barbeiroId, setBarbeiroId] = useState('');
    const [horario, setHorario] = useState('');
    const [nome, setNome] = useState('');
    const [telefone, setTelefone] = useState('');

    const [servicosDisponiveis, setServicosDisponiveis] = useState([]);
    const [barbeirosDisponiveis, setBarbeirosDisponiveis] = useState([]);
    const [horariosOcupados, setHorariosOcupados] = useState([]);

    const [loading, setLoading] = useState({ servicos: true, barbeiros: true, horarios: false, form: false });
    const [feedback, setFeedback] = useState({ message: '', type: '' });

    useEffect(() => {
        if (!db) return;
        const servicosUnsub = onSnapshot(collection(db, 'servicos'), snap => { setServicosDisponiveis(snap.docs.map(d => ({ id: d.id, ...d.data() }))); setLoading(s => ({ ...s, servicos: false })); });
        const barbeirosUnsub = onSnapshot(collection(db, 'barbeiros'), snap => { setBarbeirosDisponiveis(snap.docs.map(d => ({ id: d.id, ...d.data() }))); setLoading(s => ({ ...s, barbeiros: false })); });
        return () => { servicosUnsub(); barbeirosUnsub(); };
    }, [db]);

    useEffect(() => {
        if (!db || !data || !barbeiroId) { setHorariosOcupados([]); return; };
        setLoading(s => ({ ...s, horarios: true }));
        const q = query(collection(db, 'agendamentos'), where("data", "==", data), where("barbeiroId", "==", barbeiroId), where("status", "in", ["Pendente", "Concluído"]));
        const unsub = onSnapshot(q, snap => { setHorariosOcupados(snap.docs.map(d => d.data().horario)); setLoading(s => ({ ...s, horarios: false })); });
        return () => unsub();
    }, [db, data, barbeiroId]);

    const showFeedback = (message, type) => {
        setFeedback({ message, type });
        setTimeout(() => setFeedback({ message: '', type: '' }), 3000);
    };

    const handleSubmit = async (e) => {
        e.preventDefault();
        if (!servico || !data || !barbeiroId || !horario || !nome || !telefone) { showFeedback('Preencha todos os campos!', 'error'); return; }
        setLoading(s => ({ ...s, form: true }));

        const servicoInfo = servicosDisponiveis.find(s => s.nome === servico);
        const barbeiroInfo = barbeirosDisponiveis.find(b => b.id === barbeiroId);

        const agendamento = { servico, data, horario, barbeiroId, barbeiroNome: barbeiroInfo.nome, valor: servicoInfo?.preco || 0, cliente: { nome, telefone }, status: 'Pendente', timestamp: new Date() };

        try {
            await addDoc(collection(db, 'agendamentos'), agendamento);
            showFeedback('Agendamento realizado com sucesso!', 'success');
            setServico(''); setData(''); setBarbeiroId(''); setHorario(''); setNome(''); setTelefone('');
        } catch (error) { showFeedback('Falha ao agendar. Tente novamente.', 'error'); }
        finally { setLoading(s => ({ ...s, form: false })); }
    };

    const hoje = new Date().toISOString().split('T')[0];
    const horariosBase = ['09:00', '09:30', '10:00', '10:30', '11:00', '11:30', '12:00', '12:30', '13:00', '13:30', '14:00', '14:30', '15:00', '15:30', '16:00', '16:30', '17:00', '17:30', '18:00', '18:30', '19:00', '19:30', '20:00'];
    const agora = new Date();
    const isHoje = data === hoje;

    const horariosFiltrados = horariosBase
        .filter(h => {
            if (!isHoje) return true;
            const [horaSlot, minSlot] = h.split(':').map(Number);
            return horaSlot > agora.getHours() || (horaSlot === agora.getHours() && minSlot > agora.getMinutes());
        })
        .filter(h => !horariosOcupados.includes(h));

    return (
        <div className="w-full max-w-lg bg-gray-800 rounded-2xl shadow-2xl p-8 space-y-6">
            <h1 className="text-3xl font-bold text-white text-center">Agende seu Horário</h1>
            <FeedbackMessage message={feedback.message} type={feedback.type} />
            <form onSubmit={handleSubmit} className="space-y-4">
                <div> <label className="block text-sm font-medium text-gray-300 mb-1">Serviço</label> <select value={servico} onChange={(e) => setServico(e.target.value)} disabled={loading.servicos} className="w-full mt-1 px-4 py-3 bg-gray-700 text-white rounded-lg focus:outline-none"> <option value="">{loading.servicos ? 'Carregando...' : 'Selecione um serviço'}</option> {servicosDisponiveis.map(s => <option key={s.id} value={s.nome}>{s.nome} - R$ {s.preco.toFixed(2)}</option>)} </select> </div>
                <div> <label className="block text-sm font-medium text-gray-300 mb-1">Data</label> <input type="date" value={data} min={hoje} onChange={(e) => setData(e.target.value)} className="w-full mt-1 px-4 py-3 bg-gray-700 text-white rounded-lg focus:outline-none" /> </div>
                <div> <label className="block text-sm font-medium text-gray-300 mb-1">Barbeiro</label> <select value={barbeiroId} onChange={(e) => setBarbeiroId(e.target.value)} disabled={!data || loading.barbeiros} className="w-full mt-1 px-4 py-3 bg-gray-700 text-white rounded-lg focus:outline-none"> <option value="">{loading.barbeiros ? 'Carregando...' : 'Selecione um barbeiro'}</option> {barbeirosDisponiveis.map(b => <option key={b.id} value={b.id}>{b.nome}</option>)} </select> </div>
                <div> <label className="block text-sm font-medium text-gray-300 mb-1">Horário</label> <select value={horario} onChange={(e) => setHorario(e.target.value)} disabled={!barbeiroId || loading.horarios} className="w-full mt-1 px-4 py-3 bg-gray-700 text-white rounded-lg focus:outline-none"> <option value="">{loading.horarios ? 'Verificando...' : (data && barbeiroId ? (horariosFiltrados.length > 0 ? 'Selecione um horário' : 'Nenhum horário disponível') : 'Selecione data e barbeiro')}</option> {horariosFiltrados.map(h => <option key={h} value={h}>{h}</option>)} </select> </div>
                <div> <label className="block text-sm font-medium text-gray-300 mb-1">Seu Nome</label> <input type="text" value={nome} onChange={(e) => setNome(e.target.value)} placeholder="Nome completo" className="w-full mt-1 px-4 py-3 bg-gray-700 text-white rounded-lg focus:outline-none" /> </div>
                <div> <label className="block text-sm font-medium text-gray-300 mb-1">WhatsApp</label> <input type="tel" value={telefone} onChange={(e) => setTelefone(e.target.value)} placeholder="(XX) XXXXX-XXXX" className="w-full mt-1 px-4 py-3 bg-gray-700 text-white rounded-lg focus:outline-none" /> </div>
                <button type="submit" disabled={loading.form} className="w-full flex justify-center py-3 bg-blue-600 hover:bg-blue-700 text-white font-bold rounded-lg"> {loading.form ? <SpinnerIcon /> : 'Confirmar Agendamento'} </button>
            </form>
        </div>
    );
}

// --- Componente Principal da Aplicação (Roteador) ---
export default function App() {
    const [db, setDb] = useState(null);
    const [auth, setAuth] = useState(null);
    const [user, setUser] = useState(null);
    const [loading, setLoading] = useState(true);
    const [currentPath, setCurrentPath] = useState(window.location.pathname);
    const [feedback, setFeedback] = useState({ message: '', type: '' });

    // Inicialização e Roteamento
    useEffect(() => {
        const app = initializeApp(firebaseConfig);
        const authInstance = getAuth(app);
        const dbInstance = getFirestore(app);
        setAuth(authInstance);
        setDb(dbInstance);

        const unsubscribe = onAuthStateChanged(authInstance, (currentUser) => {
            setUser(currentUser);
            setLoading(false);
            if (currentUser && !currentUser.isAnonymous) {
                if (window.location.pathname === '/login' || window.location.pathname === '/') {
                    navigate('/admin/painel');
                }
            } else if (!currentUser) {
                signInAnonymously(authInstance).catch(console.error);
            }
        });

        const onLocationChange = () => setCurrentPath(window.location.pathname);
        window.addEventListener('popstate', onLocationChange);

        return () => { 
            unsubscribe();
            window.removeEventListener('popstate', onLocationChange);
        };
    }, []);

    const navigate = (path) => {
        window.history.pushState({}, '', path);
        setCurrentPath(path);
    };

    const showFeedback = (message, type) => {
        setFeedback({ message, type });
        setTimeout(() => setFeedback({ message: '', type: '' }), 3000);
    };

    const handleLogout = async () => {
        await signOut(auth);
        navigate('/login');
    };
    
    // Layout do Painel Administrativo
    const AdminLayout = ({ children }) => (
        <>
            <div className="w-full max-w-5xl mb-8 p-2 bg-gray-700 rounded-lg flex justify-center items-center space-x-2">
                <a href="/admin/painel" onClick={(e) => { e.preventDefault(); navigate('/admin/painel'); }} className={`px-4 py-2 rounded-md font-semibold ${currentPath.includes('/admin/painel') ? 'bg-blue-600 text-white' : 'bg-gray-600 text-gray-300'}`}>Painel</a>
                <a href="/admin/financeiro" onClick={(e) => { e.preventDefault(); navigate('/admin/financeiro'); }} className={`px-4 py-2 rounded-md font-semibold ${currentPath.includes('/admin/financeiro') ? 'bg-blue-600 text-white' : 'bg-gray-600 text-gray-300'}`}>Financeiro</a>
                <a href="/admin/config" onClick={(e) => { e.preventDefault(); navigate('/admin/config'); }} className={`px-4 py-2 rounded-md font-semibold ${currentPath.includes('/admin/config') ? 'bg-blue-600 text-white' : 'bg-gray-600 text-gray-300'}`}>Configurações</a>
                <button onClick={handleLogout} className="px-4 py-2 rounded-md font-semibold bg-red-600 hover:bg-red-700 text-white">Sair</button>
            </div>
            {children}
        </>
    );
    
    // Renderização principal
    const renderCurrentView = () => {
        const isAdmin = user && !user.isAnonymous;

        if (isAdmin) {
            switch(currentPath) {
                case '/admin/painel': return <AdminLayout><AdminPanel db={db} /></AdminLayout>;
                case '/admin/config': return <AdminLayout><ConfigPanel db={db} /></AdminLayout>;
                case '/admin/financeiro': return <AdminLayout><FinancialPanel db={db} /></AdminLayout>;
                default: navigate('/admin/painel'); return null; 
            }
        } else {
            switch(currentPath) {
                case '/login': return <LoginPanel auth={auth} showFeedback={showFeedback} />;
                default: return <AgendamentoForm db={db} />;
            }
        }
    };
    
    if (loading) return <div className="bg-gray-900 min-h-screen flex items-center justify-center text-white text-xl">A Carregar Sistema...</div>;

    return (
        <div className="bg-gray-900 min-h-screen flex flex-col items-center justify-center p-4 font-sans">
             <FeedbackMessage message={feedback.message} type={feedback.type} />
             {renderCurrentView()}
        </div>
    );
}

