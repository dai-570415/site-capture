import { BrowserRouter as Router, Routes, Route } from 'react-router-dom';
import { Index } from './pages/Index';
import './style.min.css';

// head情報
const title = 'Site Capture';
const description = 'ブラウザ上で URL を入力すると、下層ページも含めてスクリーンショットを取得し ZIP にまとめてダウンロードできるアプリです。';

document.title = title;

const headData = document.head.children;
for (let i = 0; i < headData.length; i++) {
  const nameVal = headData[i].getAttribute('name');
  if (nameVal !== null) {
    if (nameVal.indexOf('description') !== -1) {
      headData[i].setAttribute('content', description);
    }
    if (nameVal.indexOf('twitter:title') !== -1) {
      headData[i].setAttribute('content', title);
    }
    if (nameVal.indexOf('twitter:description') !== -1) {
      headData[i].setAttribute('content', description);
    }
  }
}

const App: React.FC = () => {
  return (
    <Router>
      <Routes>
        <Route path="/" element={<Index />} />
      </Routes>
    </Router>
  );
};

export default App;