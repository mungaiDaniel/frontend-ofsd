import { useState } from "react";
import { createPortal } from "react-dom";
import { Calendar, X, Check, Loader2 } from "lucide-react";

interface DeploymentDateModalProps {
  open: boolean;
  onClose: () => void;
  onConfirm: (dateString: string) => Promise<void>;
  isLoading?: boolean;
}

export function DeploymentDateModal({ open, onClose, onConfirm, isLoading = false }: DeploymentDateModalProps) {
  const [selectedDate, setSelectedDate] = useState<string>("");

  if (!open) return null;

  const handleConfirm = async () => {
    if (!selectedDate) return;
    await onConfirm(new Date(selectedDate).toISOString());
  };

  const overlayStyle: React.CSSProperties = {
    position: "fixed",
    top: 0, left: 0, right: 0, bottom: 0,
    background: "rgba(0, 0, 0, 0.4)",
    backdropFilter: "blur(4px)",
    display: "flex",
    alignItems: "center",
    justifyContent: "center",
    zIndex: 9999,
    padding: "20px"
  };

  const modalStyle: React.CSSProperties = {
    background: "#0B1228",
    borderRadius: "16px",
    width: "100%",
    maxWidth: "450px",
    border: "1px solid rgba(255, 255, 255, 0.08)",
    boxShadow: "0 24px 48px rgba(0, 0, 0, 0.4)",
    overflow: "hidden",
    display: "flex",
    flexDirection: "column",
    color: "#fff",
    fontFamily: "var(--font-sans)"
  };

  const headerStyle: React.CSSProperties = {
    padding: "20px 24px",
    borderBottom: "1px solid rgba(255,255,255,0.06)",
    display: "flex",
    alignItems: "center",
    justifyContent: "space-between"
  };

  const contentStyle: React.CSSProperties = {
    padding: "24px",
    display: "flex",
    flexDirection: "column",
    gap: "20px"
  };

  const inputStyle: React.CSSProperties = {
    width: "100%",
    background: "rgba(255, 255, 255, 0.05)",
    border: "1px solid rgba(255, 255, 255, 0.1)",
    borderRadius: "8px",
    color: "#fff",
    padding: "12px 16px",
    fontSize: "14px",
    outline: "none",
    fontFamily: "var(--font-mono)",
    colorScheme: "dark"
  };

  return createPortal(
    <div style={overlayStyle} onClick={onClose} className="scale-in">
      <div style={modalStyle} onClick={e => e.stopPropagation()}>
        {/* Header */}
        <div style={headerStyle}>
          <div className="d-flex align-items-center gap-2">
            <div
              style={{
                width: "32px", height: "32px",
                background: "rgba(59, 111, 212, 0.15)",
                color: "#3B6FD4",
                borderRadius: "8px",
                display: "flex", alignItems: "center", justifyContent: "center"
              }}
            >
              <Calendar size={16} />
            </div>
            <h3 style={{ margin: 0, fontSize: "16px", fontWeight: 600 }}>Deploy Batch to Active</h3>
          </div>
          <button
            onClick={onClose}
            disabled={isLoading}
            style={{
              background: "transparent",
              border: "none",
              color: "#94A3B8",
              cursor: isLoading ? "not-allowed" : "pointer",
              padding: "4px"
            }}
          >
            <X size={18} />
          </button>
        </div>

        {/* Content */}
        <div style={contentStyle}>
          <p style={{ margin: 0, fontSize: "14px", color: "rgba(255,255,255,0.7)", lineHeight: 1.5 }}>
            Configure the deployment date for this batch. This date serves as the baseline for all performance and valuation compounding.
          </p>

          {/* Deployment Date */}
          <div style={{ display: "flex", flexDirection: "column", gap: "8px" }}>
            <label style={{ display: "block", fontSize: "12px", color: "#94A3B8", fontWeight: 500 }}>
              DEPLOYMENT DATE <span style={{ color: "#EF4444" }}>*</span>
            </label>
            <input 
              type="date" 
              style={inputStyle}
              value={selectedDate}
              onChange={(e) => setSelectedDate(e.target.value)}
              disabled={isLoading}
            />
            <p style={{ margin: 0, fontSize: "12px", color: "rgba(255,255,255,0.5)" }}>
              Official date when funds are considered deployed and active
            </p>
          </div>

        </div>

        {/* Footer */}
        <div style={{ 
          padding: "16px 24px", 
          background: "rgba(0,0,0,0.2)", 
          borderTop: "1px solid rgba(255,255,255,0.06)",
          display: "flex", 
          justifyContent: "flex-end", 
          gap: "12px" 
        }}>
          <button
            onClick={onClose}
            disabled={isLoading}
            style={{
              background: "transparent",
              border: "1px solid rgba(255, 255, 255, 0.1)",
              color: "#fff",
              padding: "8px 16px",
              borderRadius: "6px",
              fontSize: "13px",
              fontWeight: 500,
              cursor: isLoading ? "not-allowed" : "pointer",
              transition: "all 0.2s"
            }}
            onMouseOver={e => e.currentTarget.style.background = "rgba(255, 255, 255, 0.05)"}
            onMouseOut={e => e.currentTarget.style.background = "transparent"}
          >
            Cancel
          </button>
          
          <button
            onClick={handleConfirm}
            disabled={isLoading || !selectedDate}
            style={{
              background: "#3B6FD4",
              border: "none",
              color: "#fff",
              padding: "8px 16px",
              borderRadius: "6px",
              fontSize: "13px",
              fontWeight: 500,
              cursor: (isLoading || !selectedDate) ? "not-allowed" : "pointer",
              opacity: (!selectedDate || isLoading) ? 0.6 : 1,
              display: "flex",
              alignItems: "center",
              gap: "6px",
              transition: "all 0.2s"
            }}
            onMouseOver={e => !isLoading && selectedDate && (e.currentTarget.style.background = "#2D5BB8")}
            onMouseOut={e => e.currentTarget.style.background = "#3B6FD4"}
          >
            {isLoading ? <Loader2 size={14} className="spin" /> : <Check size={14} />}
            Confirm & Deploy
          </button>
        </div>
      </div>
    </div>,
    document.body
  );
}


