import React, { useState, useEffect } from 'react';
import {
  C, SIDEBAR_W, SIDEBAR_COLLAPSED_W, NAVBAR_H, FONT, shadow,
  MOBILE_BREAKPOINT,
} from '../theme';

const STORAGE_KEY = 'gemba_sidebar_collapsed';

const MENU = [
  { id: 'dashboard', label: 'Tableau de bord', icon: '📊' },
  { id: 'audits',    label: 'Audits',          icon: '📋' },
  { id: 'import',    label: 'Importer',        icon: '📥' },
];

/* ================================================================ */
/*   SIDEBAR                                                         */
/* ================================================================ */

function Sidebar({ current, onNavigate, auditCount, collapsed, isMobile, open, onClose }) {
  /* Largeur effective */
  const width = isMobile ? SIDEBAR_W : (collapsed ? SIDEBAR_COLLAPSED_W : SIDEBAR_W);

  /* Sur mobile : position absolute + slide */
  const mobileStyle = isMobile ? {
    transform: open ? 'translateX(0)' : `translateX(-${SIDEBAR_W}px)`,
    boxShadow: open ? '0 20px 40px rgba(0,0,0,0.3)' : 'none',
  } : {};

  /* Sur mobile on n'applique PAS le mode réduit */
  const effectiveCollapsed = isMobile ? false : collapsed;

  const handleNavigate = (id) => {
    onNavigate(id);
    if (isMobile) onClose();
  };

  return (
    <>
      {/* Overlay sombre derrière la sidebar sur mobile */}
      {isMobile && open && (
        <div
          onClick={onClose}
          style={{
            position: 'fixed', inset: 0,
            backgroundColor: 'rgba(15, 23, 42, 0.5)',
            zIndex: 99,
            animation: 'fadeIn 0.2s ease',
          }}
        />
      )}

      <aside style={{
        width, height: '100vh', position: 'fixed', left: 0, top: 0,
        backgroundColor: C.sidebar, display: 'flex', flexDirection: 'column',
        fontFamily: FONT, zIndex: 100,
        transition: 'width 0.22s cubic-bezier(0.4, 0, 0.2, 1), transform 0.25s cubic-bezier(0.4, 0, 0.2, 1)',
        overflow: 'hidden',
        ...mobileStyle,
      }}>

        {/* Header */}
        <div style={{
          padding: effectiveCollapsed ? '20px 0' : '20px 20px 18px',
          borderBottom: `1px solid ${C.sidebarBorder}`,
          display: 'flex', alignItems: 'center', justifyContent: 'center',
          minHeight: 78,
        }}>
          <div style={{
            display: 'flex', alignItems: 'center', gap: 10,
            width: '100%', justifyContent: effectiveCollapsed ? 'center' : 'flex-start',
          }}>
            <div style={{
              width: 38, height: 38, borderRadius: 10, flexShrink: 0,
              background: 'linear-gradient(135deg, #2563eb 0%, #7c3aed 100%)',
              display: 'flex', alignItems: 'center', justifyContent: 'center',
              fontSize: 13, color: '#fff', fontWeight: 800, letterSpacing: -0.5,
            }}>5S</div>
            {!effectiveCollapsed && (
              <div style={{ overflow: 'hidden', flex: 1 }}>
                <div style={{ color: '#fff', fontWeight: 800, fontSize: 14, lineHeight: 1.2, whiteSpace: 'nowrap' }}>
                  GEMBA
                </div>
                <div style={{ color: C.sidebarText, fontSize: 11, marginTop: 1, whiteSpace: 'nowrap' }}>
                  Audits 5S
                </div>
              </div>
            )}
            {isMobile && (
              <button
                onClick={onClose}
                style={{
                  width: 32, height: 32, borderRadius: 8, border: 'none',
                  backgroundColor: C.sidebarHover, color: '#fff',
                  cursor: 'pointer', fontSize: 16, flexShrink: 0,
                  display: 'flex', alignItems: 'center', justifyContent: 'center',
                }}
              >✕</button>
            )}
          </div>
        </div>

        {/* Menu */}
        <nav style={{
          flex: 1, padding: effectiveCollapsed ? '12px 8px' : '12px',
          overflowY: 'auto', overflowX: 'hidden',
        }}>
          {!effectiveCollapsed && (
            <div style={{
              color: C.sidebarText, fontSize: 10, fontWeight: 700, letterSpacing: 1.2,
              padding: '8px 12px 6px', textTransform: 'uppercase',
            }}>Navigation</div>
          )}

          {MENU.map(item => {
            const active = current === item.id;
            return (
              <button
                key={item.id}
                onClick={() => handleNavigate(item.id)}
                title={effectiveCollapsed ? item.label : undefined}
                style={{
                  display: 'flex', alignItems: 'center',
                  gap: effectiveCollapsed ? 0 : 12,
                  justifyContent: effectiveCollapsed ? 'center' : 'flex-start',
                  width: '100%',
                  padding: effectiveCollapsed ? '12px 0' : '10px 12px',
                  marginBottom: 2,
                  backgroundColor: active ? C.primary : 'transparent',
                  color: active ? '#fff' : C.sidebarText,
                  border: 'none', borderRadius: 8, cursor: 'pointer',
                  fontSize: 14, fontWeight: active ? 600 : 500,
                  fontFamily: 'inherit', textAlign: 'left',
                  transition: 'background-color 0.15s ease',
                  position: 'relative',
                }}
                onMouseEnter={(e) => { if (!active) e.currentTarget.style.backgroundColor = C.sidebarHover; }}
                onMouseLeave={(e) => { if (!active) e.currentTarget.style.backgroundColor = 'transparent'; }}
              >
                <span style={{ fontSize: 16, width: 20, textAlign: 'center', flexShrink: 0 }}>
                  {item.icon}
                </span>

                {!effectiveCollapsed && <span style={{ flex: 1, whiteSpace: 'nowrap' }}>{item.label}</span>}

                {!effectiveCollapsed && item.id === 'audits' && auditCount > 0 && (
                  <span style={{
                    fontSize: 11, fontWeight: 700,
                    backgroundColor: active ? 'rgba(255,255,255,0.25)' : 'rgba(148,163,184,0.15)',
                    color: active ? '#fff' : C.sidebarText,
                    padding: '2px 8px', borderRadius: 999,
                  }}>{auditCount}</span>
                )}

                {effectiveCollapsed && item.id === 'audits' && auditCount > 0 && (
                  <span style={{
                    position: 'absolute', top: 4, right: 6,
                    minWidth: 16, height: 16, padding: '0 4px',
                    borderRadius: 999, backgroundColor: active ? '#fff' : C.danger,
                    color: active ? C.primary : '#fff',
                    fontSize: 9, fontWeight: 800, lineHeight: '16px', textAlign: 'center',
                  }}>{auditCount > 99 ? '99+' : auditCount}</span>
                )}
              </button>
            );
          })}
        </nav>

        {/* Footer */}
        <div style={{
          padding: effectiveCollapsed ? '12px 8px' : '16px',
          borderTop: `1px solid ${C.sidebarBorder}`,
          display: 'flex', alignItems: 'center',
          justifyContent: effectiveCollapsed ? 'center' : 'flex-start',
          gap: 10,
        }}>
          <div style={{
            width: 32, height: 32, borderRadius: 999,
            backgroundColor: C.sidebarHover,
            display: 'flex', alignItems: 'center', justifyContent: 'center',
            fontSize: 14, flexShrink: 0,
          }}>👤</div>
          {!effectiveCollapsed && (
            <div style={{ flex: 1, minWidth: 0 }}>
              <div style={{ color: '#fff', fontSize: 12, fontWeight: 600, lineHeight: 1.2, whiteSpace: 'nowrap' }}>Admin</div>
              <div style={{ color: C.sidebarText, fontSize: 10, marginTop: 1 }}>v1.0</div>
            </div>
          )}
        </div>
      </aside>
    </>
  );
}

/* ================================================================ */
/*   NAVBAR                                                          */
/* ================================================================ */

function Navbar({ title, subtitle, onRefresh, refreshing, rightSlot, onToggleSidebar, collapsed, isMobile }) {
  return (
    <header style={{
      height: NAVBAR_H, backgroundColor: C.surface,
      borderBottom: `1px solid ${C.border}`,
      padding: isMobile ? '0 14px' : '0 20px',
      display: 'flex', alignItems: 'center', justifyContent: 'space-between',
      position: 'sticky', top: 0, zIndex: 50,
      fontFamily: FONT, gap: 12,
    }}>

      <div style={{ display: 'flex', alignItems: 'center', gap: 12, flex: 1, minWidth: 0 }}>
        <button
          onClick={onToggleSidebar}
          title={collapsed ? 'Ouvrir le menu' : 'Fermer le menu'}
          style={{
            width: 38, height: 38, borderRadius: 8,
            borderWidth: 1, borderStyle: 'solid', borderColor: C.border,
            backgroundColor: C.surface, color: C.text,
            cursor: 'pointer', fontSize: 16, fontFamily: 'inherit',
            display: 'flex', alignItems: 'center', justifyContent: 'center',
            flexShrink: 0, transition: 'all 0.15s ease',
          }}
          onMouseEnter={(e) => {
            e.currentTarget.style.backgroundColor = C.primaryLt;
            e.currentTarget.style.borderColor = C.primary;
          }}
          onMouseLeave={(e) => {
            e.currentTarget.style.backgroundColor = C.surface;
            e.currentTarget.style.borderColor = C.border;
          }}
        >
          {isMobile ? '☰' : (collapsed ? '☰' : '◀')}
        </button>

        <div style={{ minWidth: 0, flex: 1 }}>
          <h1 style={{
            margin: 0,
            fontSize: isMobile ? 16 : 18,
            fontWeight: 700, color: C.text,
            letterSpacing: -0.3, whiteSpace: 'nowrap',
            overflow: 'hidden', textOverflow: 'ellipsis',
          }}>{title}</h1>
          {subtitle && (
            <div style={{
              fontSize: isMobile ? 11 : 12, color: C.textSoft, marginTop: 1,
              whiteSpace: 'nowrap', overflow: 'hidden', textOverflow: 'ellipsis',
            }}>{subtitle}</div>
          )}
        </div>
      </div>

      <div style={{ display: 'flex', gap: 8, alignItems: 'center', flexShrink: 0 }}>
        {rightSlot}
        {onRefresh && (
          <button
            onClick={onRefresh}
            disabled={refreshing}
            title="Recharger"
            style={{
              padding: isMobile ? '8px 10px' : '8px 14px',
              borderRadius: 8,
              backgroundColor: C.surface, color: C.textSoft,
              borderWidth: 1, borderStyle: 'solid', borderColor: C.border,
              fontSize: 13, fontWeight: 600,
              cursor: refreshing ? 'wait' : 'pointer',
              fontFamily: 'inherit',
              display: 'flex', alignItems: 'center', gap: 6,
              opacity: refreshing ? 0.6 : 1,
              transition: 'all 0.15s ease',
            }}
          >
            <span>{refreshing ? '⏳' : '🔄'}</span>
            {!isMobile && <span>Recharger</span>}
          </button>
        )}
      </div>
    </header>
  );
}

/* ================================================================ */
/*   LAYOUT                                                          */
/* ================================================================ */

export default function Layout({
  current, onNavigate, auditCount,
  title, subtitle, onRefresh, refreshing, rightSlot,
  children,
}) {
  const [collapsed, setCollapsed] = useState(() => {
    if (typeof window === 'undefined') return false;
    return localStorage.getItem(STORAGE_KEY) === '1';
  });
  const [isMobile, setIsMobile] = useState(
    typeof window !== 'undefined' ? window.innerWidth < MOBILE_BREAKPOINT : false
  );
  const [drawerOpen, setDrawerOpen] = useState(false);

  useEffect(() => {
    if (typeof window === 'undefined') return;
    const onResize = () => {
      const mob = window.innerWidth < MOBILE_BREAKPOINT;
      setIsMobile(mob);
      if (!mob) setDrawerOpen(false);
    };
    window.addEventListener('resize', onResize);
    return () => window.removeEventListener('resize', onResize);
  }, []);

  useEffect(() => {
    if (typeof window !== 'undefined' && !isMobile) {
      localStorage.setItem(STORAGE_KEY, collapsed ? '1' : '0');
    }
  }, [collapsed, isMobile]);

  const toggle = () => {
    if (isMobile) setDrawerOpen((o) => !o);
    else setCollapsed((c) => !c);
  };

  /* Marge gauche : 0 sur mobile, sinon largeur sidebar */
  const mainMarginLeft = isMobile ? 0 : (collapsed ? SIDEBAR_COLLAPSED_W : SIDEBAR_W);

  return (
    <div style={{
      minHeight: '100vh', backgroundColor: C.bg, fontFamily: FONT,
      display: 'flex',
    }}>
      <Sidebar
        current={current}
        onNavigate={onNavigate}
        auditCount={auditCount}
        collapsed={collapsed}
        isMobile={isMobile}
        open={drawerOpen}
        onClose={() => setDrawerOpen(false)}
      />
      <div style={{
        marginLeft: mainMarginLeft,
        flex: 1, minWidth: 0,
        display: 'flex', flexDirection: 'column',
        transition: 'margin-left 0.22s cubic-bezier(0.4, 0, 0.2, 1)',
      }}>
        <Navbar
          title={title} subtitle={subtitle}
          onRefresh={onRefresh} refreshing={refreshing}
          rightSlot={rightSlot}
          onToggleSidebar={toggle}
          collapsed={collapsed || (isMobile && !drawerOpen)}
          isMobile={isMobile}
        />
        <main style={{
          flex: 1,
          padding: isMobile ? 12 : 24,
          overflowY: 'auto',
          overflowX: 'hidden',
        }}>
          <div style={{ maxWidth: 1400, margin: '0 auto' }}>
            {children}
          </div>
        </main>
      </div>
    </div>
  );
}
