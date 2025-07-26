import React, { useState } from 'react';

const BuildingPopup = ({ building, isVisible, onClose, position }) => {
  const [isHovering, setIsHovering] = useState(false);
  if (!isVisible || !building) return null;

  const formatCurrency = (value) => {
    return new Intl.NumberFormat('en-US', {
      style: 'currency',
      currency: 'USD',
      minimumFractionDigits: 0,
      maximumFractionDigits: 0,
    }).format(value);
  };

  const popupStyle = {
    position: 'fixed',
    left: `${position.x + 10}px`,
    top: `${position.y + 10}px`,
    zIndex: 1000,
    backgroundColor: 'rgba(20, 20, 30, 0.85)',
    backdropFilter: 'blur(12px)',
    WebkitBackdropFilter: 'blur(12px)',
    border: '1px solid rgba(255, 255, 255, 0.1)',
    borderRadius: '16px',
    padding: '20px',
    minWidth: '280px',
    maxWidth: '320px',
    boxShadow: '0 8px 32px rgba(0, 0, 0, 0.3)',
    color: '#ffffff',
    fontFamily: '-apple-system, BlinkMacSystemFont, "Segoe UI", Roboto, sans-serif',
    opacity: isVisible ? 1 : 0,
    transform: isVisible ? 'translateY(0)' : 'translateY(-10px)',
    transition: 'all 0.3s cubic-bezier(0.4, 0, 0.2, 1)',
    pointerEvents: 'auto',
  };

  const headerStyle = {
    display: 'flex',
    justifyContent: 'space-between',
    alignItems: 'flex-start',
    marginBottom: '16px',
  };

  const titleStyle = {
    fontSize: '18px',
    fontWeight: '600',
    margin: 0,
    color: '#ffffff',
    lineHeight: '1.4',
    paddingRight: '10px',
  };

  const closeButtonStyle = {
    background: 'rgba(255, 255, 255, 0.1)',
    border: 'none',
    borderRadius: '8px',
    color: '#ffffff',
    cursor: 'pointer',
    fontSize: '16px',
    fontWeight: '500',
    padding: '6px 10px',
    minWidth: '28px',
    height: '28px',
    display: 'flex',
    alignItems: 'center',
    justifyContent: 'center',
    transition: 'background-color 0.2s ease',
    flexShrink: 0,
  };

  const closeButtonHoverStyle = {
    ...closeButtonStyle,
    backgroundColor: 'rgba(255, 255, 255, 0.2)',
  };

  const detailRowStyle = {
    display: 'flex',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: '12px',
    paddingBottom: '8px',
    borderBottom: '1px solid rgba(255, 255, 255, 0.1)',
  };

  const lastDetailRowStyle = {
    ...detailRowStyle,
    marginBottom: 0,
    paddingBottom: 0,
    borderBottom: 'none',
  };

  const labelStyle = {
    fontSize: '14px',
    color: 'rgba(255, 255, 255, 0.7)',
    fontWeight: '500',
  };

  const valueStyle = {
    fontSize: '14px',
    color: '#ffffff',
    fontWeight: '600',
    textAlign: 'right',
  };

  const addressStyle = {
    fontSize: '14px',
    color: 'rgba(255, 255, 255, 0.8)',
    marginBottom: '16px',
    lineHeight: '1.4',
  };

  return (
    <div style={popupStyle}>
      <div style={headerStyle}>
        <h3 style={titleStyle}>{building.name}</h3>
        <button
          style={isHovering ? closeButtonHoverStyle : closeButtonStyle}
          onClick={onClose}
          onMouseEnter={() => setIsHovering(true)}
          onMouseLeave={() => setIsHovering(false)}
          aria-label="Close popup"
        >
          ×
        </button>
      </div>
      
      <div style={addressStyle}>
        {building.address}
      </div>

      <div style={detailRowStyle}>
        <span style={labelStyle}>Height</span>
        <span style={valueStyle}>{building.height} ft</span>
      </div>

      <div style={detailRowStyle}>
        <span style={labelStyle}>Value</span>
        <span style={valueStyle}>{formatCurrency(building.value)}</span>
      </div>

      <div style={lastDetailRowStyle}>
        <span style={labelStyle}>Zoning</span>
        <span style={valueStyle}>{building.zoning}</span>
      </div>
    </div>
  );
};

export default BuildingPopup;