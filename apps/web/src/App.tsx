import { BrowserRouter as Router, Routes, Route } from 'react-router-dom';
import { Home } from './pages/Home';
import { CreateProposal } from './pages/CreateProposal';
import { RAGManagement } from './pages/RAGManagement';
import { ProposalView } from './pages/ProposalView';
import { ProposalsList } from './pages/ProposalsList';
import { ProposalDesigner } from './pages/ProposalDesigner';

function App() {
  return (
    <Router>
      <Routes>
        <Route path="/" element={<Home />} />
        <Route path="/proposals" element={<ProposalsList />} />
        <Route path="/create/:templateId" element={<CreateProposal />} />
        <Route path="/proposal/:proposalId" element={<ProposalView />} />
        <Route path="/proposals/:id/design" element={<ProposalDesigner />} />
        <Route path="/rag" element={<RAGManagement />} />
      </Routes>
    </Router>
  );
}

export default App;
