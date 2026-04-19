import { Component, inject, signal, computed } from '@angular/core';
import { CommonModule } from '@angular/common';
import { toSignal, toObservable } from '@angular/core/rxjs-interop';
import { FormsModule, ReactiveFormsModule, FormBuilder, FormGroup, Validators } from '@angular/forms';
import { Router } from '@angular/router';
import { switchMap } from 'rxjs';
import { Coupon, Membership, CouponType, MembershipType } from '../../core/models';
import { Coupons } from '../../core/services/coupon';
import { Memberships } from '../../core/services/membership';
import { Customers } from '../../core/services/customer';
import { Identity } from '../../core/services/auth';
import { Toasts } from '../../core/services/ui/toast';
import { Spinner } from '../../shared/components/spinner/spinner';

@Component({
  selector: 'app-marketing-list',
  imports: [CommonModule, FormsModule, ReactiveFormsModule, Spinner],
  templateUrl: './marketing-list.html'
})
export class MarketingList {
  private couponService = inject(Coupons);
  private membershipService = inject(Memberships);
  private customersService = inject(Customers);
  private toastService = inject(Toasts);
  public authService = inject(Identity);
  private fb = inject(FormBuilder);
  private router = inject(Router);

  // FormGroups Reactivos (SOLID - Initialized via Field Injection)
  public couponForm = this.fb.group({
    code: ['', [Validators.required, Validators.minLength(3)]],
    discount: [0, [Validators.required, Validators.min(0)]],
    type: ['PERCENT', Validators.required],
    isActive: [true]
  });

  public membershipForm = this.fb.group({
    name: ['', Validators.required],
    price: [0, [Validators.required, Validators.min(0)]],
    type: ['ILIMITADO', Validators.required],
    benefits: [[] as string[]]
  });

  // Estado temporal para beneficios (UI)

  // Data Signals
  coupons = toSignal(this.couponService.getCoupons(), { initialValue: [] });
  memberships = toSignal(this.membershipService.getMemberships(), { initialValue: [] });
  customers = toSignal(this.customersService.getSearchIndex(), { initialValue: [] });

  // KPIs de Marketing (Computed)
  activeCouponsCount = computed(() => this.coupons().filter(c => c.isActive).length);
  totalMembershipsCount = computed(() => this.memberships().length);
  premiumMembershipsCount = computed(() => this.memberships().filter(m => m.price > 50).length);

  // UI State: Modales y Drawer
  isModalOpen = signal(false);
  isDrawerOpen = signal(false);
  modalMode = signal<'create' | 'edit'>('create');
  editingId = signal<string | null>(null);
  selectedMembershipId = signal<string | null>(null);
  
  // Missing UI Signals (Restored for Build)
  activeTab = signal<'coupons' | 'memberships'>('coupons');
  isLoading = signal(false);
  tempBenefit = signal('');
  currentBenefits = signal<string[]>([]);

  // Intelligence Analytics (Reactive)
  selectedMembership = computed(() => 
    this.memberships().find(m => m.id === this.selectedMembershipId())
  );

  linkedCustomers = computed(() => 
    this.customers().filter(c => c.membershipId === this.selectedMembershipId())
  );

  projectedMRR = computed(() => 
    (this.selectedMembership()?.price || 0) * this.linkedCustomers().length
  );

  setTab(tab: 'coupons' | 'memberships') {
    this.activeTab.set(tab);
    this.closeDrawer();
  }

  // Control del Drawer Inteligente
  openDrawer(id: string) {
    this.selectedMembershipId.set(id);
    this.isDrawerOpen.set(true);
  }

  closeDrawer() {
    this.isDrawerOpen.set(false);
    this.selectedMembershipId.set(null);
  }

  openCreateModal() {
    this.modalMode.set('create');
    this.editingId.set(null);
    this.currentBenefits.set([]);
    this.couponForm.reset({ code: '', discount: 0, type: 'PERCENT', isActive: true });
    this.membershipForm.reset();
    this.membershipForm.patchValue({ name: '', price: 0, type: 'ILIMITADO', benefits: [] });
    this.isModalOpen.set(true);
  }

  openEditModal(item: any) {
    this.modalMode.set('edit');
    this.editingId.set(item.id);
    this.currentBenefits.set(item.benefits || []);
    
    if (this.activeTab() === 'coupons') {
      this.couponForm.patchValue(item);
    } else {
      this.membershipForm.patchValue({
        ...item,
        benefits: item.benefits || []
      });
    }
    
    this.isModalOpen.set(true);
  }

  async saveItem() {
    if (this.activeTab() === 'coupons' && this.couponForm.invalid) {
      this.toastService.error('Formulario de cupón inválido');
      return;
    }
    if (this.activeTab() === 'memberships' && this.membershipForm.invalid) {
      this.toastService.error('Formulario de membresía inválido');
      return;
    }

    this.isLoading.set(true);
    try {
      if (this.activeTab() === 'coupons') {
        await this.saveCoupon();
      } else {
        await this.saveMembership();
      }
      this.isModalOpen.set(false);
      this.toastService.success('Guardado correctamente');
    } catch (error: any) {
      this.toastService.error('Error al guardar');
    } finally {
      this.isLoading.set(false);
    }
  }

  private async saveCoupon() {
    const val = this.couponForm.value;
    const data: Partial<Coupon> = {
      code: val.code ?? '',
      discount: val.discount ?? 0,
      type: (val.type as CouponType) ?? 'PERCENT',
      isActive: val.isActive ?? true
    };

    if (this.modalMode() === 'create') {
      await this.couponService.addCoupon(data as Coupon);
    } else if (this.editingId()) {
      await this.couponService.updateCoupon(this.editingId()!, data);
    }
  }

  private async saveMembership() {
    const val = this.membershipForm.value;
    const data: Partial<Membership> = {
      name: val.name ?? '',
      price: val.price ?? 0,
      type: (val.type as MembershipType) ?? 'ILIMITADO',
      benefits: this.currentBenefits()
    };

    if (this.modalMode() === 'create') {
      await this.membershipService.addMembership(data as Membership);
    } else if (this.editingId()) {
      await this.membershipService.updateMembership(this.editingId()!, data);
    }
  }

  // --- Lógica de Beneficios (CRUD Interno) ---
  addBenefit() {
    const benefit = this.tempBenefit().trim();
    if (benefit) {
      this.currentBenefits.update(prev => [...prev, benefit]);
      this.tempBenefit.set('');
    }
  }

  removeBenefit(index: number) {
    this.currentBenefits.update(prev => prev.filter((_, i) => i !== index));
  }

  // --- Navegación y Acciones del Drawer ---
  goToCustomer(customerId: string) {
    this.closeDrawer();
    this.router.navigate(['/app/clientes', customerId]);
  }

  editFromDrawer() {
    const membership = this.selectedMembership();
    if (membership) {
      this.closeDrawer();
      this.openEditModal(membership);
    }
  }

  async deleteItem(id: string) {
    if (!confirm('¿Estás seguro de eliminar este elemento?')) return;
    
    this.isLoading.set(true);
    try {
      if (this.activeTab() === 'coupons') {
        await this.couponService.deleteCoupon(id);
      } else {
        await this.membershipService.deleteMembership(id);
      }
      this.toastService.success('Eliminado correctamente');
    } catch (error: any) {
      this.toastService.error('Error al eliminar');
    } finally {
      this.isLoading.set(false);
    }
  }
}
