import { Component, OnInit, ChangeDetectorRef } from '@angular/core';
import { Router } from '@angular/router';
import {
  GenealogyService, GenealogyTree, BreedingEdge,
  PetNode, OffspringMini
} from '../../services/genealogy.service';
import { ToastService } from '../../services/toast.service';

@Component({
  standalone: false,
  selector: 'app-genealogy',
  templateUrl: './genealogy.component.html',
  styleUrls: ['./genealogy.component.css']
})
export class GenealogyComponent implements OnInit {
  tree: GenealogyTree | null = null;
  isLoading = true;
  error: string | null = null;

  // Zoom / pan
  scale = 1;
  translateX = 0;
  translateY = 0;
  private isPanning = false;
  private panStartX = 0;
  private panStartY = 0;

  // Search
  searchQuery = '';

  // Offspring group popup
  selectedGroup: BreedingEdge | null = null;

  // Convert confirmation
  convertTarget: OffspringMini | null = null;
  isConverting = false;

  constructor(
    private genealogyService: GenealogyService,
    private toastr: ToastService,
    private router: Router,
    private cdr: ChangeDetectorRef
  ) {}

  ngOnInit(): void {
    this.loadTree();
  }

  loadTree(): void {
    this.isLoading = true;
    this.error = null;
    this.genealogyService.getTree().subscribe({
      next: (tree) => {
        this.tree = tree;
        this.isLoading = false;
        this.cdr.detectChanges();
      },
      error: () => {
        this.error = 'Failed to load genealogy tree.';
        this.isLoading = false;
        this.cdr.detectChanges();
      }
    });
  }

  // ── Zoom ──
  zoomIn(): void { this.scale = Math.min(this.scale + 0.15, 2.5); }
  zoomOut(): void { this.scale = Math.max(this.scale - 0.15, 0.3); }
  resetZoom(): void { this.scale = 1; this.translateX = 0; this.translateY = 0; }

  get transformStyle(): string {
    return `translate(${this.translateX}px, ${this.translateY}px) scale(${this.scale})`;
  }

  onWheel(event: WheelEvent): void {
    event.preventDefault();
    if (event.deltaY < 0) { this.zoomIn(); } else { this.zoomOut(); }
  }

  onMouseDown(event: MouseEvent): void {
    this.isPanning = true;
    this.panStartX = event.clientX - this.translateX;
    this.panStartY = event.clientY - this.translateY;
  }
  onMouseMove(event: MouseEvent): void {
    if (!this.isPanning) return;
    this.translateX = event.clientX - this.panStartX;
    this.translateY = event.clientY - this.panStartY;
  }
  onMouseUp(): void { this.isPanning = false; }

  // ── Offspring group popup ──
  openGroup(edge: BreedingEdge): void {
    this.selectedGroup = edge;
  }
  closeGroup(): void {
    this.selectedGroup = null;
  }

  // ── Convert offspring to pet ──
  openConvertConfirm(offspring: OffspringMini): void {
    this.convertTarget = offspring;
  }
  cancelConvert(): void {
    this.convertTarget = null;
  }
  confirmConvert(): void {
    if (!this.convertTarget) return;
    this.isConverting = true;
    this.genealogyService.convertOffspringToPet(this.convertTarget.id).subscribe({
      next: (res) => {
        this.toastr.success(res.message, 'Converted');
        this.isConverting = false;
        this.convertTarget = null;
        this.closeGroup();
        this.loadTree();
      },
      error: (err) => {
        const detail = err?.error?.detail || 'Conversion failed.';
        if (detail === 'OFFSPRING_ALREADY_CONVERTED') {
          this.toastr.warning('This offspring has already been converted.', 'Already Converted');
        } else if (detail === 'OFFSPRING_ALREADY_ARCHIVED') {
          this.toastr.warning('This offspring is archived and cannot be converted.', 'Archived');
        } else {
          this.toastr.error(detail, 'Error');
        }
        this.isConverting = false;
        this.convertTarget = null;
        this.cdr.detectChanges();
      }
    });
  }

  formatDate(iso?: string): string {
    if (!iso) return '';
    const d = new Date(iso + 'T00:00:00');
    return d.toLocaleDateString('en-US', { month: 'short', day: 'numeric', year: 'numeric' });
  }

  genderIcon(g?: string): string {
    return g === 'Male' ? 'bi-gender-male' : g === 'Female' ? 'bi-gender-female' : 'bi-question-circle';
  }
  genderColor(g?: string): string {
    return g === 'Male' ? '#3b82f6' : g === 'Female' ? '#ec4899' : '#9ca3af';
  }

  edgeMatchesSearch(edge: BreedingEdge): boolean {
    const q = this.searchQuery.trim().toLowerCase();
    if (!q) return true;
    const names: string[] = [];
    if (edge.father?.name) names.push(edge.father.name.toLowerCase());
    if (edge.mother?.name) names.push(edge.mother.name.toLowerCase());
    for (const cp of edge.converted_pets) {
      if (cp.name) names.push(cp.name.toLowerCase());
    }
    for (const o of edge.offspring_group.offsprings) {
      if (o.name) names.push(o.name.toLowerCase());
    }
    return names.some(n => n.includes(q));
  }

  get hasSearchQuery(): boolean {
    return this.searchQuery.trim().length > 0;
  }
}
