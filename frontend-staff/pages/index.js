import { useEffect, useState } from 'react';
const API = process.env.NEXT_PUBLIC_API_URL || 'http://localhost:8000';

export default function Staff() {
  const [queueData, setQueueData] = useState({ queue: [], current: null, waitingCount: 0 });
  const [selectedQueueId, setSelectedQueueId] = useState(null);
  const [selectedQueueNumber, setSelectedQueueNumber] = useState(null);
  const [order, setOrder] = useState(null);
  const [message, setMessage] = useState('');
  const [confirmClear, setConfirmClear] = useState(false);

  async function loadQueue() {
    try {
      const res = await fetch(`${API}/queue`);
      const data = await res.json();
      setQueueData(data);
    } catch {
      setMessage('無法取得隊列資料');
    }
  }

  async function callNext() {
    try {
      const res = await fetch(`${API}/queue/next`, { method: 'POST' });
      const data = await res.json();
      if (data.message) setMessage(data.message); else setMessage('已叫下一號');
      await loadQueue();
      setOrder(null);
      setSelectedQueueId(null);
      setSelectedQueueNumber(null);
    } catch {
      setMessage('叫號失敗');
    }
  }

  async function clearQueue() {
    try {
      const res = await fetch(`${API}/queue/clear`, { method: 'POST' });
      const data = await res.json();
      if (!res.ok) throw new Error(data.error || '清空失敗');
      setMessage(data.message || '已清空今日 queue');
      setOrder(null);
      setSelectedQueueId(null);
      setSelectedQueueNumber(null);
      setConfirmClear(false);
      await loadQueue();
    } catch {
      setMessage('清空 queue 失敗');
      setConfirmClear(false);
    }
  }

  async function loadOrder(queueId, queueNumber) {
    setSelectedQueueId(queueId);
    setSelectedQueueNumber(queueNumber);
    try {
      const res = await fetch(`${API}/order/${queueId}`);
      if (!res.ok) { setOrder(null); return; }
      const data = await res.json();
      setOrder(data);
    } catch {
      setOrder(null);
    }
  }

  useEffect(() => {
    loadQueue();
    const timer = setInterval(loadQueue, 3000);
    return () => clearInterval(timer);
  }, []);

  return (
    <div className="page">
      <div className="container">
        <div className="topbar">
          <div>
            <div className="topTitle">櫃台店員端</div>
            <div className="topSub">查看隊列與預點餐草稿，協助現場手寫點單</div>
          </div>
          <div className="muted">顧客端：localhost:3000</div>
        </div>

        <div className="metrics">
          <div className="card">
            <div className="metricLabel">目前叫號</div>
            <div className="metricValue">{queueData.current ? queueData.current.number : '尚未叫號'}</div>
          </div>
          <div className="card">
            <div className="metricLabel">等待中</div>
            <div className="metricValue">{queueData.waitingCount} 組</div>
          </div>
        </div>

        <div className="staffActions">
          <button className="dangerBtn" onClick={callNext}>叫下一號</button>
          <button className="clearBtn" onClick={() => setConfirmClear(true)}>清空今日 queue</button>
        </div>
        {message && <div className="card" style={{ color: '#92400e' }}>{message}</div>}

        <div className="layout">
          <div className="col">
            <h2 className="sectionTitle">隊列清單</h2>
            <div className="muted" style={{ marginBottom: 12 }}>點選號碼即可查看該客人的預點餐草稿。</div>
            {queueData.queue.map((item) => (
              <button key={item.id} className="queueItem" onClick={() => loadOrder(item.id, item.number)}>
                <div className="queueTop">
                  <span>號碼 {item.number}</span>
                  <span className={`statusTag ${item.status}`}>{item.status === 'waiting' ? '等待中' : item.status === 'called' ? '已叫號' : '完成'}</span>
                </div>
                <div className="queueHint">按一下查看草稿</div>
              </button>
            ))}
          </div>

          <div className="col">
         
            {!selectedQueueId && <div className="muted">尚未選擇號碼。</div>}
            {selectedQueueId && !order && <div className="muted">這位客人尚未預點餐。</div>}
            {order && (
              <div className="orderCard">
                <div className="orderTitle">號碼 {selectedQueueNumber}</div>
                {order.items.map((item, idx) => (
                  <div className="orderItem" key={idx}>
                    <div className="orderName">{item.name} × {item.quantity || 1}</div>
                    <div className="orderOptions">種類：{item.category || '未填'}｜規格：{item.variant || '未填'}</div>
                    <div className="orderOptions">{item.options?.length ? item.options.join('、') : '無其他偏好'}</div>
                  </div>
                ))}
                <div className="noteTitle">備註</div>
                <div>{order.note || '無'}</div>
                <div className="tip">此頁面只供櫃台參考，實際出單仍由店員手寫。</div>
              </div>
            )}
          </div>
        </div>

        {confirmClear && (
          <div className="modalOverlay">
            <div className="staffModal">
              <div className="modalTitle">確認清空今日 queue？</div>
              <div className="modalText">這會刪除今天所有排隊號碼與預點餐草稿，通常用在一天營業結束之後。</div>
              <div className="modalActions">
                <button className="outlineModalBtn" onClick={() => setConfirmClear(false)}>取消</button>
                <button className="dangerModalBtn" onClick={clearQueue}>確認清空</button>
              </div>
            </div>
          </div>
        )}
      </div>
    </div>
  );
}
