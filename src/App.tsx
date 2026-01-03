import { BrowserRouter, Routes, Route } from 'react-router-dom';
import ConversationPage from './pages/ConversationPage';
import TasksPage from './pages/TasksPage';

function App() {
  return (
    <BrowserRouter>
      <Routes>
        <Route path="/" element={<TasksPage />} />
        <Route path="/conversation" element={<ConversationPage />} />
      </Routes>
    </BrowserRouter>
  );
}

export default App;
