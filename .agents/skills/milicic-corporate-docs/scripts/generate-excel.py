#!/usr/bin/env python3
"""
generate-excel.py - Generador de Planillas Excel Institucionales de Milicic S.A.
Utiliza openpyxl con la paleta de colores corporativa, formato numérico profesional,
bloque de resumen KPI superior y autoajuste de columnas.
Invocación recomendada: uv run --with openpyxl python generate-excel.py [output.xlsx]
"""

import sys
import os

# Soporte de codificación para consolas Windows
if hasattr(sys.stdout, 'reconfigure'):
    sys.stdout.reconfigure(encoding='utf-8')

from openpyxl import Workbook
from openpyxl.styles import Font, PatternFill, Alignment, Border, Side
from openpyxl.utils import get_column_letter

def build_milicic_workbook(output_path="reporte-ejecutivo-milicic.xlsx"):
    wb = Workbook()
    ws = wb.active
    ws.title = "Resumen Ejecutivo"
    ws.views.sheetView[0].showGridLines = True

    # Paleta Corporativa Milicic S.A.
    COLOR_PRIMARY = "EA580C"       # Naranja Milicic
    COLOR_SLATE_DARK = "0F172A"    # Pizarra Oscura
    COLOR_SLATE_LEAD = "1E293B"    # Texto Cabeceras
    COLOR_ZEBRA = "F8FAFC"         # Gris tenue para filas alternadas
    COLOR_CARD_BG = "FFF7ED"       # Naranja tenue para KPIs
    COLOR_BORDER = "E2E8F0"        # Bordes sutiles
    COLOR_WHITE = "FFFFFF"

    # Fuentes
    font_brand = Font(name="Segoe UI", size=16, bold=True, color=COLOR_WHITE)
    font_subtitle = Font(name="Segoe UI", size=9, italic=True, color="94A3B8")
    font_kpi_label = Font(name="Segoe UI", size=8, bold=True, color="64748B")
    font_kpi_val = Font(name="Segoe UI", size=14, bold=True, color=COLOR_PRIMARY)
    font_header = Font(name="Segoe UI", size=10, bold=True, color=COLOR_WHITE)
    font_data = Font(name="Segoe UI", size=9, color="334155")
    font_data_bold = Font(name="Segoe UI", size=9, bold=True, color="0F172A")

    # Rellenos
    fill_brand = PatternFill(start_color=COLOR_SLATE_DARK, end_color=COLOR_SLATE_DARK, fill_type="solid")
    fill_header = PatternFill(start_color=COLOR_PRIMARY, end_color=COLOR_PRIMARY, fill_type="solid")
    fill_header_dark = PatternFill(start_color=COLOR_SLATE_DARK, end_color=COLOR_SLATE_DARK, fill_type="solid")
    fill_zebra = PatternFill(start_color=COLOR_ZEBRA, end_color=COLOR_ZEBRA, fill_type="solid")
    fill_kpi = PatternFill(start_color=COLOR_CARD_BG, end_color=COLOR_CARD_BG, fill_type="solid")

    # Bordes
    thin_border_side = Side(border_style="thin", color=COLOR_BORDER)
    border_cell = Border(left=thin_border_side, right=thin_border_side, top=thin_border_side, bottom=thin_border_side)
    border_orange_top = Border(top=Side(border_style="medium", color=COLOR_PRIMARY), left=thin_border_side, right=thin_border_side, bottom=thin_border_side)

    # Alineaciones
    align_center = Alignment(horizontal="center", vertical="center")
    align_left = Alignment(horizontal="left", vertical="center")
    align_right = Alignment(horizontal="right", vertical="center")

    # 1. BANNER INSTITUCIONAL SUPERIOR (Filas 1 y 2)
    ws.merge_cells("A1:G1")
    ws["A1"] = "MILICIC S.A. | Reporte Ejecutivo de Infraestructura & Operaciones"
    ws["A1"].font = font_brand
    ws["A1"].fill = fill_brand
    ws["A1"].alignment = Alignment(horizontal="left", vertical="center", indent=1)
    ws.row_dimensions[1].height = 36

    ws.merge_cells("A2:G2")
    ws["A2"] = "Gerencia de Infraestructura y TI  •  Documento Oficial  •  Confidencial"
    ws["A2"].font = font_subtitle
    ws["A2"].fill = fill_brand
    ws["A2"].alignment = Alignment(horizontal="left", vertical="center", indent=1)
    ws.row_dimensions[2].height = 18

    # Espacio
    ws.row_dimensions[3].height = 12

    # 2. TARJETAS KPI RESUMEN (Filas 4 y 5)
    kpis = [
        ("A", "B", "SITIOS ACTIVOS", "14 / 14"),
        ("C", "D", "DISPONIBILIDAD SLA", "99.98%"),
        ("E", "F", "OPERADORES REGISTRADOS", "485"),
        ("G", "G", "INCIDENTES CRÍTICOS", "0")
    ]

    for start_col, end_col, label, val in kpis:
        # Fila label
        if start_col != end_col:
            ws.merge_cells(f"{start_col}4:{end_col}4")
            ws.merge_cells(f"{start_col}5:{end_col}5")
        
        c_label = ws[f"{start_col}4"]
        c_label.value = label
        c_label.font = font_kpi_label
        c_label.fill = fill_kpi
        c_label.alignment = align_center

        c_val = ws[f"{start_col}5"]
        c_val.value = val
        c_val.font = font_kpi_val
        c_val.fill = fill_kpi
        c_val.alignment = align_center

        for col_char in [start_col, end_col]:
            ws[f"{col_char}4"].border = border_orange_top
            ws[f"{col_char}5"].border = border_cell

    ws.row_dimensions[4].height = 18
    ws.row_dimensions[5].height = 28
    ws.row_dimensions[6].height = 16

    # 3. TABLA DE DATOS GERENCIAL (Comienza en Fila 7)
    headers = [
        "ID Sitio", "Campamento / Faena", "Ubicación Geográfica", 
        "Enlace WAN", "Hardware Local", "Usuarios Activos", "Presupuesto Mensual USD"
    ]

    for col_idx, header in enumerate(headers, start=1):
        cell = ws.cell(row=7, column=col_idx, value=header)
        cell.font = font_header
        cell.fill = fill_header_dark
        cell.alignment = align_center if col_idx in [1, 4] else (align_right if col_idx in [6, 7] else align_left)
        cell.border = border_cell
    
    ws.row_dimensions[7].height = 26

    data_rows = [
        ("SIT-01", "Campamento Minero Los Azules", "San Juan (Alta Cordillera)", "Starlink Business Gen3", "Raspberry Pi 5 (8GB) + NVMe", 120, 2450.00),
        ("SIT-02", "Proyecto Litio Salar Hombre Muerto", "Catamarca (Puna)", "Starlink + 4G Redundante", "Raspberry Pi 5 (8GB) + NVMe", 85, 2800.00),
        ("SIT-03", "Obrador Autopista Ruta 34", "Santa Fe", "Fibra Óptica 100 Mbps", "Micro-Server Ubuntu Core", 64, 950.00),
        ("SIT-04", "Parque Eólico La Angostura", "Chubut (Patagonia)", "Starlink Standard", "Raspberry Pi 4 (8GB)", 42, 1850.00),
        ("SIT-05", "Faena Minera Josemaría", "San Juan (Cordillera)", "Starlink Business Gen3", "Raspberry Pi 5 (8GB) + NVMe", 95, 2450.00),
        ("SIT-06", "Acueducto Ganadero San Rafael", "Mendoza", "Enlace Satelital Geo + 4G", "Micro-Server Ubuntu Core", 34, 1400.00),
        ("SIT-07", "Dique Tambolar Etapa II", "San Juan", "Starlink + Radioenlace", "Raspberry Pi 5 (8GB) + NVMe", 45, 2100.00),
    ]

    current_row = 8
    for row in data_rows:
        is_even = (current_row % 2 == 0)
        row_fill = fill_zebra if is_even else PatternFill(fill_type=None)

        for col_idx, val in enumerate(row, start=1):
            cell = ws.cell(row=current_row, column=col_idx, value=val)
            cell.border = border_cell
            if row_fill.fill_type:
                cell.fill = row_fill

            if col_idx == 1:
                cell.font = font_data_bold
                cell.alignment = align_center
            elif col_idx in [2, 3, 4, 5]:
                cell.font = font_data
                cell.alignment = align_left
            elif col_idx == 6:
                cell.font = font_data_bold
                cell.alignment = align_right
                cell.number_format = '#,##0'
            elif col_idx == 7:
                cell.font = font_data_bold
                cell.alignment = align_right
                cell.number_format = '$ #,##0.00'

        ws.row_dimensions[current_row].height = 22
        current_row += 1

    # Fila de Totales
    total_row = current_row
    ws.cell(row=total_row, column=2, value="TOTAL CONSOLIDADO").font = font_header
    ws.cell(row=total_row, column=2).alignment = align_left
    
    # Celda suma de usuarios
    c_users = ws.cell(row=total_row, column=6, value=f"=SUM(F8:F{total_row-1})")
    c_users.font = font_header
    c_users.alignment = align_right
    c_users.number_format = '#,##0'

    # Celda suma de presupuesto
    c_cost = ws.cell(row=total_row, column=7, value=f"=SUM(G8:G{total_row-1})")
    c_cost.font = font_header
    c_cost.alignment = align_right
    c_cost.number_format = '$ #,##0.00'

    for col in range(1, 8):
        c = ws.cell(row=total_row, column=col)
        c.fill = fill_header
        c.border = border_cell
        if not c.value and col not in [2, 6, 7]:
            c.value = ""

    ws.row_dimensions[total_row].height = 24

    # Autofilter sobre el rango de cabecera
    ws.auto_filter.ref = f"A7:G{total_row-1}"

    # Congelar paneles bajo la cabecera de datos
    ws.freeze_panes = "A8"

    # Ajuste automático inteligente de ancho de columnas
    for col in ws.columns:
        max_len = 0
        col_letter = get_column_letter(col[0].column)
        for cell in col:
            # Ignorar filas de banner 1 y 2 para no ensanchar la col A
            if cell.row in [1, 2]:
                continue
            val_str = str(cell.value or '')
            if len(val_str) > max_len:
                max_len = len(val_str)
        ws.column_dimensions[col_letter].width = max(max_len + 5, 14)

    os.makedirs(os.path.dirname(os.path.abspath(output_path)), exist_ok=True)
    wb.save(output_path)
    print(f"✅ Planilla Excel Milicic generada con éxito: {output_path}")

if __name__ == "__main__":
    out = sys.argv[1] if len(sys.argv) > 1 else "reporte-ejecutivo-milicic.xlsx"
    build_milicic_workbook(out)
