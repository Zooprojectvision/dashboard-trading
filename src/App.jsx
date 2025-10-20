/* ========== STYLISATION DES FILTRES – THEME DARK PRO ========== */
select, input[type=date], input[type=range] {
  width: 100%;
  background: #0d0d0d;
  border: 1px solid #2a2a2a;
  color: #f2f2f2;
  border-radius: 10px;
  padding: 8px 10px;
  font-size: 14px;
  appearance: none;
  -webkit-appearance: none;
  -moz-appearance: none;
  outline: none;
  transition: all 0.2s ease;
}

select:hover, input[type=date]:hover, input[type=range]:hover {
  border-color: #d4af37;
}

select:focus, input[type=date]:focus, input[type=range]:focus {
  border-color: #d4af37;
  box-shadow: 0 0 0 2px rgba(212, 175, 55, 0.25);
}

option {
  background: #121212;
  color: #ffffff;
}

input[type=range] {
  accent-color: #d4af37;
}
