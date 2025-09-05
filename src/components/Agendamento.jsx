import React, { useState, useEffect, useRef } from 'react';
import { initializeApp } from 'firebase/app';
import { getFirestore, collection, addDoc, getDocs, onSnapshot, doc, updateDoc, deleteDoc, query, where, getDoc } from 'firebase/firestore';
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
const WhatsAppIcon = () => (<svg xmlns="http://www.w3.org/2000/svg" className="h-5 w-5 text-green-400 hover:text-green-300" viewBox="0 0 24 24" fill="currentColor"><path d="M.057 24l1.687-6.163c-1.041-1.804-1.588-3.849-1.587-5.946.003-6.556 5.338-11.891 11.893-11.891 3.181.001 6.167 1.24 8.413 3.488 2.245 2.248 3.487 5.235 3.487 8.413.003 6.557-5.338 11.892-11.893 11.892-1.99-.001-3.951-.5-5.688-1.448l-6.305 1.654zm6.597-3.807c1.676.995 3.276 1.591 5.392 1.592 5.448 0 9.886-4.434 9.889-9.885.002-5.462-4.415-9.89-9.881-9.892-5.452 0-9.887 4.434-9.889 9.886-.001 2.269.654 4.542 1.916 6.448l-1.294 4.722 4.793-1.251z" /></svg>);

// --- Componente de Modal de Confirmação ---
const ConfirmationModal = ({ isOpen, onClose, onConfirm, title, message }) => {
    if (!isOpen) return null;

    return (
        <div className="fixed inset-0 bg-black bg-opacity-70 z-50 flex justify-center items-center p-4">
            <div className="bg-gray-800 rounded-2xl shadow-xl p-8 w-full max-w-md mx-auto">
                <h3 className="text-2xl font-bold text-white mb-4">{title}</h3>
                <p className="text-gray-300 mb-8">{message}</p>
                <div className="flex justify-end gap-4">
                    <button onClick={onClose} className="px-6 py-2 bg-gray-600 hover:bg-gray-500 text-white font-semibold rounded-lg transition-colors">Cancelar</button>
                    <button onClick={onConfirm} className="px-6 py-2 bg-red-600 hover:bg-red-500 text-white font-semibold rounded-lg transition-colors">Confirmar</button>
                </div>
            </div>
        </div>
    );
};


// --- Páginas de Ação do Cliente ---
function ActionPage({ db, action }) {
    const [message, setMessage] = useState('A processar a sua ação...');
    const [type, setType] = useState('');

    useEffect(() => {
        const processAction = async () => {
            const params = new URLSearchParams(window.location.search);
            const id = params.get('id');
            if (!id) {
                setMessage('ID do agendamento não encontrado.');
                setType('error');
                return;
            }

            const agendamentoRef = doc(db, 'agendamentos', id);
            const newStatus = action === 'confirm' ? 'Confirmado' : 'Cancelado';

            try {
                const docSnap = await getDoc(agendamentoRef);
                if (!docSnap.exists()) {
                    setMessage('Agendamento não encontrado.');
                    setType('error');
                    return;
                }

                const currentStatus = docSnap.data().status;
                if (currentStatus !== 'Pendente') {
                    setMessage(`Este agendamento já foi ${currentStatus.toLowerCase()}.`);
                    setType('error');
                    return;
                }

                await updateDoc(agendamentoRef, { status: newStatus });
                setMessage(`Agendamento ${newStatus.toLowerCase()} com sucesso!`);
                setType('success');
            } catch (error) {
                setMessage('Ocorreu um erro ao processar a sua ação. Por favor, tente novamente.');
                setType('error');
                console.error("Action page error:", error);
            }
        };

        if (db) {
            processAction();
        }
    }, [db, action]);

    return (
        <div className="w-full max-w-lg bg-gray-800 rounded-2xl shadow-2xl p-8 space-y-6 text-center">
            <FeedbackMessage message={message} type={type} />
            <a href="/" className="text-blue-400 hover:underline">Voltar à página inicial</a>
        </div>
    );
}

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

    const handleExportPDF = () => {
        if (!window.jspdf) {
            alert("A biblioteca de PDF ainda está a ser carregada. Tente novamente.");
            return;
        }

        const { jsPDF } = window.jspdf;
        const doc = new jsPDF();

        const nomeBarbeiroFiltro = selectedBarberId === 'todos' ? 'Todos os Barbeiros' : barbeiros.find(b => b.id === selectedBarberId)?.nome;

        doc.setFontSize(18);
        doc.text(`Relatório Financeiro - ${meses[currentMonth]} de ${currentYear}`, 14, 22);
        doc.setFontSize(12);
        doc.text(`Barbeiro: ${nomeBarbeiroFiltro}`, 14, 30);

        const summaryText = `Faturamento Total: R$ ${faturamentoTotal.toFixed(2).replace('.', ',')} | Serviços Concluídos: ${servicosConcluidos} | Ticket Médio: R$ ${ticketMedio.toFixed(2).replace('.', ',')}`;
        doc.setFontSize(10);
        doc.text(summaryText, 14, 40);

        const tableColumn = ["Data", "Cliente", "Barbeiro", "Serviço", "Valor (R$)"];
        const tableRows = [];

        agendamentosFiltrados.forEach(ag => {
            const agData = [
                ag.dataObj.toLocaleDateString(),
                ag.cliente.nome,
                ag.barbeiroNome,
                ag.servico,
                ag.valor.toFixed(2).replace('.', ',')
            ];
            tableRows.push(agData);
        });

        doc.autoTable({
            head: [tableColumn],
            body: tableRows,
            startY: 50,
            headStyles: { fillColor: [31, 41, 55] },
            theme: 'grid',
        });

        doc.save(`Relatorio_Financeiro_${meses[currentMonth]}_${currentYear}.pdf`);
    };

    return (
        <div className="w-full max-w-6xl bg-gray-800 rounded-2xl shadow-2xl p-8 space-y-8">
            <div className="flex justify-between items-center">
                <h1 className="text-3xl font-bold text-white">Painel Financeiro</h1>
                <button onClick={handleExportPDF} className="px-4 py-2 bg-green-600 hover:bg-green-700 text-white font-bold rounded-lg transition duration-300">Exportar para PDF</button>
            </div>

            <div className="flex flex-wrap justify-center items-center gap-4 bg-gray-700 p-3 rounded-lg">
                <select value={currentMonth} onChange={(e) => setCurrentMonth(Number(e.target.value))} className="bg-gray-600 text-white p-2 rounded-md focus:outline-none">{meses.map((mes, index) => <option key={index} value={index}>{mes}</option>)}</select>
                <select value={currentYear} onChange={(e) => setCurrentYear(Number(e.target.value))} className="bg-gray-600 text-white p-2 rounded-md focus:outline-none">{anosDisponiveis.map(ano => <option key={ano} value={ano}>{ano}</option>)}</select>
                <select value={selectedBarberId} onChange={(e) => setSelectedBarberId(e.target.value)} className="bg-gray-600 text-white p-2 rounded-md focus:outline-none"><option value="todos">Todos os Barbeiros</option>{barbeiros.map(barbeiro => <option key={barbeiro.id} value={barbeiro.id}>{barbeiro.nome}</option>)}</select>
            </div>

            {loading ? <div className="flex justify-center"><SpinnerIcon /></div> : (
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

function ConfigPanel({ db }) {
    const [servicos, setServicos] = useState([]);
    const [barbeiros, setBarbeiros] = useState([]);
    const [loading, setLoading] = useState(true);
    const [feedback, setFeedback] = useState({ message: '', type: '' });

    const [novoServicoNome, setNovoServicoNome] = useState('');
    const [novoServicoPreco, setNovoServicoPreco] = useState('');
    const [novoBarbeiroNome, setNovoBarbeiroNome] = useState('');

    const [modalState, setModalState] = useState({ isOpen: false, idToDelete: null, type: null, message: '' });

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

    const handleAdicionarBarbeiro = async (e) => {
        e.preventDefault();
        if (!novoBarbeiroNome) { showFeedback('Insira o nome do barbeiro.', 'error'); return; }
        try {
            await addDoc(collection(db, 'barbeiros'), { nome: novoBarbeiroNome });
            showFeedback('Barbeiro adicionado!', 'success');
            setNovoBarbeiroNome('');
        } catch (error) { showFeedback('Erro ao adicionar barbeiro.', 'error'); }
    };

    const handleDeleteClick = (id, type, nome) => {
        setModalState({
            isOpen: true,
            idToDelete: id,
            type: type,
            message: `Tem a certeza de que deseja excluir "${nome}"? Esta ação não pode ser desfeita.`
        });
    };

    const handleConfirmDelete = async () => {
        const { idToDelete, type } = modalState;
        if (!idToDelete || !type) return;

        const collectionName = type === 'servico' ? 'servicos' : 'barbeiros';
        try {
            await deleteDoc(doc(db, collectionName, idToDelete));
            showFeedback(`${type.charAt(0).toUpperCase() + type.slice(1)} excluído com sucesso!`, 'success');
        } catch (error) {
            showFeedback(`Erro ao excluir ${type}.`, 'error');
        } finally {
            setModalState({ isOpen: false, idToDelete: null, type: null, message: '' });
        }
    };

    return (
        <>
            <ConfirmationModal
                isOpen={modalState.isOpen}
                onClose={() => setModalState({ isOpen: false, idToDelete: null, type: null, message: '' })}
                onConfirm={handleConfirmDelete}
                title="Confirmar Exclusão"
                message={modalState.message}
            />
            <div className="w-full max-w-4xl bg-gray-800 rounded-2xl shadow-2xl p-8 space-y-8">
                <h1 className="text-3xl font-bold text-white text-center">Painel de Configurações</h1>
                <FeedbackMessage message={feedback.message} type={feedback.type} />
                <div className="grid grid-cols-1 md:grid-cols-2 gap-8">
                    <div>
                        <h2 className="text-xl font-semibold text-white mb-4 border-b border-gray-700 pb-2">Gerenciar Serviços</h2>
                        <form onSubmit={handleAdicionarServico} className="bg-gray-700 p-4 rounded-lg flex flex-col gap-4 mb-6">
                            <input type="text" value={novoServicoNome} onChange={(e) => setNovoServicoNome(e.target.value)} placeholder="Nome do Serviço" className="w-full px-4 py-2 bg-gray-600 text-white rounded-lg focus:outline-none" />
                            <input type="number" value={novoServicoPreco} onChange={(e) => setNovoServicoPreco(e.target.value)} placeholder="Preço" className="w-full px-4 py-2 bg-gray-600 text-white rounded-lg focus:outline-none" />
                            <button type="submit" className="px-6 py-2 bg-blue-600 hover:bg-blue-700 text-white font-bold rounded-lg">Adicionar Serviço</button>
                        </form>
                        <div className="space-y-3 h-48 overflow-y-auto no-scrollbar">{loading ? <p>A carregar...</p> : servicos.map(s => (<div key={s.id} className="bg-gray-700 p-3 rounded-lg flex justify-between items-center"><div><p className="font-semibold text-white">{s.nome}</p><p className="text-sm text-gray-300">R$ {s.preco.toFixed(2)}</p></div><button onClick={() => handleDeleteClick(s.id, 'servico', s.nome)} className="text-red-400 hover:text-red-300">Excluir</button></div>))}</div>
                    </div>
                    <div>
                        <h2 className="text-xl font-semibold text-white mb-4 border-b border-gray-700 pb-2">Gerenciar Barbeiros</h2>
                        <form onSubmit={handleAdicionarBarbeiro} className="bg-gray-700 p-4 rounded-lg flex flex-col gap-4 mb-6">
                            <input type="text" value={novoBarbeiroNome} onChange={(e) => setNovoBarbeiroNome(e.target.value)} placeholder="Nome do Barbeiro" className="w-full px-4 py-2 bg-gray-600 text-white rounded-lg focus:outline-none" />
                            <button type="submit" className="px-6 py-2 bg-blue-600 hover:bg-blue-700 text-white font-bold rounded-lg">Adicionar Barbeiro</button>
                        </form>
                        <div className="space-y-3 h-48 overflow-y-auto no-scrollbar">{loading ? <p>A carregar...</p> : barbeiros.map(b => (<div key={b.id} className="bg-gray-700 p-3 rounded-lg flex justify-between items-center"><p className="font-semibold text-white">{b.nome}</p><button onClick={() => handleDeleteClick(b.id, 'barbeiro', b.nome)} className="text-red-400 hover:text-red-300">Excluir</button></div>))}</div>
                    </div>
                </div>
            </div>
        </>
    );
}

function AdminPanel({ db }) {
    const [agendamentos, setAgendamentos] = useState([]);
    const [loading, setLoading] = useState(true);
    const [openMenuId, setOpenMenuId] = useState(null);
    const [feedback, setFeedback] = useState({ message: '', type: '' });
    const menuRef = useRef(null);
    const [currentPage, setCurrentPage] = useState(1);
    const ITEMS_PER_PAGE = 10;

    const [modalState, setModalState] = useState({ isOpen: false, idToDelete: null, message: '' });

    useEffect(() => {
        if (!db) return;
        const agendamentosCollectionRef = collection(db, 'agendamentos');
        const unsubscribe = onSnapshot(agendamentosCollectionRef, (querySnapshot) => {
            const agendamentosData = querySnapshot.docs.map(doc => ({ id: doc.id, ...doc.data() }));
            agendamentosData.sort((a, b) => new Date(`${b.data}T${b.horario}`) - new Date(`${a.data}T${a.horario}`));
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

    const handleDeleteClick = (id) => {
        setOpenMenuId(null);
        setModalState({ isOpen: true, idToDelete: id, message: 'Tem a certeza que deseja excluir este agendamento?' });
    };

    const handleConfirmDelete = async () => {
        if (!modalState.idToDelete) return;
        try {
            await deleteDoc(doc(db, 'agendamentos', modalState.idToDelete));
            showFeedback('Agendamento excluído com sucesso!', 'success');
        } catch (error) {
            showFeedback('Erro ao excluir agendamento.', 'error');
        } finally {
            setModalState({ isOpen: false, idToDelete: null, message: '' });
        }
    };

    const totalPages = Math.ceil(agendamentos.length / ITEMS_PER_PAGE);
    const paginatedAgendamentos = agendamentos.slice((currentPage - 1) * ITEMS_PER_PAGE, currentPage * ITEMS_PER_PAGE);

    const getStatusClass = (status) => {
        switch (status) {
            case 'Concluído': return 'bg-green-900 text-green-300';
            case 'Cancelado': return 'bg-red-900 text-red-300';
            case 'Confirmado': return 'bg-blue-900 text-blue-300';
            default: return 'bg-yellow-900 text-yellow-300';
        }
    };

    const handleWhatsAppClick = (ag) => {
        const telefoneLimpo = ag.cliente.telefone.replace(/\D/g, '');
        const telefoneCompleto = `55${telefoneLimpo}`;
        const baseUrl = window.location.origin;
        const linkConfirmar = `${baseUrl}/confirmar?id=${ag.id}`;
        const linkCancelar = `${baseUrl}/cancelar?id=${ag.id}`;
        const texto = `Olá, ${ag.cliente.nome}! Para confirmar o seu agendamento no dia ${new Date(ag.data + 'T00:00:00').toLocaleDateString()} às ${ag.horario}, por favor, clique no link: ${linkConfirmar}\n\nSe precisar cancelar, use este link: ${linkCancelar}\n\nObrigado!`;
        const url = `https://wa.me/${telefoneCompleto}?text=${encodeURIComponent(texto)}`;
        window.open(url, '_blank');
    };

    return (
        <>
            <ConfirmationModal
                isOpen={modalState.isOpen}
                onClose={() => setModalState({ isOpen: false, idToDelete: null, message: '' })}
                onConfirm={handleConfirmDelete}
                title="Confirmar Exclusão"
                message={modalState.message}
            />
            <div className="w-full max-w-6xl bg-gray-800 rounded-2xl shadow-2xl p-8 space-y-6">
                <h1 className="text-3xl font-bold text-white text-center">Painel de Agendamentos</h1>
                <FeedbackMessage message={feedback.message} type={feedback.type} />
                <div className="overflow-x-auto no-scrollbar">
                    {loading ? (<p className="text-center text-gray-300">A carregar...</p>) : paginatedAgendamentos.length === 0 ? (<p className="text-center text-gray-400 bg-gray-700 p-4 rounded-lg">Nenhum agendamento encontrado.</p>) : (
                        <table className="min-w-full text-sm text-left text-gray-300">
                            <thead className="bg-gray-700 text-xs uppercase"><tr><th className="px-6 py-3">Data</th><th className="px-6 py-3">Hora</th><th className="px-6 py-3">Cliente</th><th className="px-6 py-3">Barbeiro</th><th className="px-6 py-3">Serviço</th><th className="px-6 py-3">Contacto</th><th className="px-6 py-3 text-center">Status</th><th className="px-6 py-3 text-center">Ações</th></tr></thead>
                            <tbody>
                                {paginatedAgendamentos.map(ag => (
                                    <tr key={ag.id} className="bg-gray-800 border-b border-gray-700 hover:bg-gray-600">
                                        <td className="px-6 py-4">{new Date(ag.data + 'T00:00:00').toLocaleDateString()}</td>
                                        <td className="px-6 py-4">{ag.horario}</td>
                                        <td className="px-6 py-4 font-medium text-white">{ag.cliente.nome}</td>
                                        <td className="px-6 py-4">{ag.barbeiroNome}</td>
                                        <td className="px-6 py-4">{ag.servico}</td>
                                        <td className="px-6 py-4 flex items-center justify-center gap-2">{ag.cliente.telefone}<a href="#" onClick={(e) => { e.preventDefault(); handleWhatsAppClick(ag); }} title="Confirmar via WhatsApp"><WhatsAppIcon /></a></td>
                                        <td className="px-6 py-4 text-center"><span className={`text-xs font-medium px-2.5 py-0.5 rounded-full ${getStatusClass(ag.status)}`}>{ag.status}</span></td>
                                        <td className="px-6 py-4 text-center">
                                            <div className="relative inline-block text-left action-menu-container">
                                                <button
                                                    onClick={() => {
                                                        const novoId = openMenuId === ag.id ? null : ag.id;
                                                        setOpenMenuId(novoId);

                                                        // só faz o scroll se estiver abrindo
                                                        if (novoId) {
                                                            setTimeout(() => {
                                                                const menu = document.getElementById(`menu-${ag.id}`);
                                                                if (menu) {
                                                                    menu.scrollIntoView({
                                                                        behavior: "smooth",
                                                                        block: "nearest",
                                                                    });
                                                                }
                                                            }, 50);
                                                        }
                                                    }}
                                                    className="p-2 rounded-full hover:bg-gray-700"
                                                >
                                                    <KebabIcon />
                                                </button>

                                                {openMenuId === ag.id && (
                                                <div id={`menu-${ag.id}`}
                                                    ref={menuRef}
                                                    className="origin-top-right absolute right-0 mt-2 w-48 rounded-md shadow-lg bg-gray-700 ring-1 ring-black ring-opacity-5 z-10"><a href="#" onClick={(e) => { e.preventDefault(); handleUpdateStatus(ag.id, 'Concluído'); setOpenMenuId(null); }} className="block w-full text-left px-4 py-2 text-sm text-green-400 hover:bg-gray-600">Concluir</a><a href="#" onClick={(e) => { e.preventDefault(); handleUpdateStatus(ag.id, 'Cancelado'); setOpenMenuId(null); }} className="block w-full text-left px-4 py-2 text-sm text-red-400 hover:bg-gray-600">Cancelar</a><a href="#" onClick={(e) => { e.preventDefault(); handleDeleteClick(ag.id); }} className="block w-full text-left px-4 py-2 text-sm text-gray-300 hover:bg-gray-600">Excluir</a></div>)}
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
        </>
    );
}

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
        const q = query(collection(db, 'agendamentos'), where("data", "==", data), where("barbeiroId", "==", barbeiroId), where("status", "in", ["Pendente", "Confirmado", "Concluído"]));
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
            <h1 className="text-3xl font-bold text-white text-center">Agende o seu Horário</h1>
            <FeedbackMessage message={feedback.message} type={feedback.type} />
            <form onSubmit={handleSubmit} className="space-y-4">
                <div> <label className="block text-sm font-medium text-gray-300 mb-1">Serviço</label> <select value={servico} onChange={(e) => setServico(e.target.value)} disabled={loading.servicos} className="w-full mt-1 px-4 py-3 bg-gray-700 text-white rounded-lg focus:outline-none"> <option value="">{loading.servicos ? 'A carregar...' : 'Selecione um serviço'}</option> {servicosDisponiveis.map(s => <option key={s.id} value={s.nome}>{s.nome} - R$ {s.preco.toFixed(2)}</option>)} </select> </div>
                <div> <label className="block text-sm font-medium text-gray-300 mb-1">Data</label> <input type="date" value={data} min={hoje} onChange={(e) => setData(e.target.value)} className="w-full mt-1 px-4 py-3 bg-gray-700 text-white rounded-lg focus:outline-none" /> </div>
                <div> <label className="block text-sm font-medium text-gray-300 mb-1">Barbeiro</label> <select value={barbeiroId} onChange={(e) => setBarbeiroId(e.target.value)} disabled={!data || loading.barbeiros} className="w-full mt-1 px-4 py-3 bg-gray-700 text-white rounded-lg focus:outline-none"> <option value="">{loading.barbeiros ? 'A carregar...' : 'Selecione um barbeiro'}</option> {barbeirosDisponiveis.map(b => <option key={b.id} value={b.id}>{b.nome}</option>)} </select> </div>
                <div> <label className="block text-sm font-medium text-gray-300 mb-1">Horário</label> <select value={horario} onChange={(e) => setHorario(e.target.value)} disabled={!barbeiroId || loading.horarios} className="w-full mt-1 px-4 py-3 bg-gray-700 text-white rounded-lg focus:outline-none"> <option value="">{loading.horarios ? 'A verificar...' : (data && barbeiroId ? (horariosFiltrados.length > 0 ? 'Selecione um horário' : 'Nenhum horário disponível') : 'Selecione data e barbeiro')}</option> {horariosFiltrados.map(h => <option key={h} value={h}>{h}</option>)} </select> </div>
                <div> <label className="block text-sm font-medium text-gray-300 mb-1">O seu Nome</label> <input type="text" value={nome} onChange={(e) => setNome(e.target.value)} placeholder="Nome completo" className="w-full mt-1 px-4 py-3 bg-gray-700 text-white rounded-lg focus:outline-none" /> </div>
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

    useEffect(() => {
        const loadScript = (src) => new Promise((resolve, reject) => {
            if (document.querySelector(`script[src="${src}"]`)) return resolve();
            const script = document.createElement('script');
            script.src = src;
            script.onload = () => resolve();
            script.onerror = () => reject(new Error(`Falha ao carregar script ${src}`));
            document.body.appendChild(script);
        });

        loadScript("https://cdnjs.cloudflare.com/ajax/libs/jspdf/2.5.1/jspdf.umd.min.js")
            .then(() => loadScript("https://cdnjs.cloudflare.com/ajax/libs/jspdf-autotable/3.5.23/jspdf.plugin.autotable.min.js"))
            .catch(error => console.error("Falha ao carregar scripts de PDF:", error));

        const app = initializeApp(firebaseConfig);
        const authInstance = getAuth(app);
        const dbInstance = getFirestore(app);
        setAuth(authInstance);
        setDb(dbInstance);

        const unsubscribe = onAuthStateChanged(authInstance, (currentUser) => {
            setUser(currentUser);
            setLoading(false);
            if (currentUser && !currentUser.isAnonymous) {
                if (['/login', '/'].includes(window.location.pathname)) navigate('/admin/painel');
            } else if (!currentUser) {
                signInAnonymously(authInstance).catch(console.error);
            }
        });
        const onLocationChange = () => setCurrentPath(window.location.pathname);
        window.addEventListener('popstate', onLocationChange);
        return () => { unsubscribe(); window.removeEventListener('popstate', onLocationChange); };
    }, []);

    const navigate = (path) => {
        window.history.pushState({}, '', path);
        setCurrentPath(path);
    };

    const [feedback, setFeedback] = useState({ message: '', type: '' });
    const showFeedback = (message, type) => {
        setFeedback({ message, type });
        setTimeout(() => setFeedback({ message: '', type: '' }), 3000);
    };

    const handleLogout = async () => {
        await signOut(auth);
        navigate('/login');
    };

    const AdminLayout = ({ children }) => (
    <>
        {/* ... sua barra de navegação fixa ... */}
        <div className="fixed top-0 left-0 w-full z-50 bg-gray-700 p-3 shadow-lg flex justify-center items-center space-x-2">
            {/* ... botões ... */}
            <a href="/admin/painel" onClick={(e) => { e.preventDefault(); navigate('/admin/painel'); }} className={`px-4 py-2 rounded-md font-semibold ${currentPath.includes('/admin/painel') ? 'bg-blue-600 text-white' : 'bg-gray-600 text-gray-300'}`}>Painel</a>
            <a href="/admin/financeiro" onClick={(e) => { e.preventDefault(); navigate('/admin/financeiro'); }} className={`px-4 py-2 rounded-md font-semibold ${currentPath.includes('/admin/financeiro') ? 'bg-blue-600 text-white' : 'bg-gray-600 text-gray-300'}`}>Financeiro</a>
            <a href="/admin/config" onClick={(e) => { e.preventDefault(); navigate('/admin/config'); }} className={`px-4 py-2 rounded-md font-semibold ${currentPath.includes('/admin/config') ? 'bg-blue-600 text-white' : 'bg-gray-600 text-gray-300'}`}>Configurações</a>
            <button onClick={handleLogout} className="px-4 py-2 rounded-md font-semibold bg-red-600 hover:bg-red-700 text-white">Sair</button>
        </div>

        {/* Container do conteúdo principal -- AGORA CENTRALIZADO */}
        <div className="pt-24 w-full flex flex-col items-center px-4">
             {children}
        </div>
    </>
    );

    const renderCurrentView = () => {
        const isAdmin = user && !user.isAnonymous;
        const path = currentPath.split('?')[0];

        if (isAdmin) {
            switch (path) {
                case '/admin/painel': return <AdminLayout><AdminPanel db={db} /></AdminLayout>;
                case '/admin/config': return <AdminLayout><ConfigPanel db={db} /></AdminLayout>;
                case '/admin/financeiro': return <AdminLayout><FinancialPanel db={db} /></AdminLayout>;
                default: navigate('/admin/painel'); return null;
            }
        } else {
            switch (path) {
                case '/login': return <LoginPanel auth={auth} showFeedback={showFeedback} />;
                case '/confirmar': return <ActionPage db={db} action="confirm" />;
                case '/cancelar': return <ActionPage db={db} action="cancel" />;
                default: return <AgendamentoForm db={db} />;
            }
        }
    };

    if (loading) return <div className="bg-gray-900 min-h-screen flex items-center justify-center text-white text-xl">A Carregar...</div>;

    return (
        <div className="bg-gray-900 min-h-screen flex flex-col items-center justify-center p-4 font-sans">
            <FeedbackMessage message={feedback.message} type={feedback.type} />
            {renderCurrentView()}
        </div>
    );
}

