import { Component, inject, signal } from '@angular/core';
import { CommonModule } from '@angular/common';
import { toSignal, toObservable } from '@angular/core/rxjs-interop';
import { FormsModule } from '@angular/forms';
import { switchMap } from 'rxjs';
import { Coupon, Membership, CouponType, MembershipType } from '../../core/models';
import { Coupons } from '../../core/services/coupon';
import { Memberships } from '../../core/services/membership';
import { Identity } from '../../core/services/auth';
import { Toasts } from '../../core/services/ui/toast';

@Component({
  selector: 'app-marketing-list',
  standalone: true,
  imports: [CommonModule, FormsModule],
  templateUrl: './marketing-list.html'
})
export class MarketingList {
  private couponService = inject(Coupons);
  private membershipService = inject(Memberships);
  private toastService = inject(Toasts);
  public authService = inject(Identity);

  // Estado de Navegación
  activeTab = signal<'coupons' | 'memberships'>('coupons');

  // Data Signals
  coupons = toSignal(this.couponService.getCoupons(), { initialValue: [] });
  memberships = toSignal(this.membershipService.getMemberships(), { initialValue: [] });

  // UI State
  isModalOpen = signal(false);
  modalMode = signal<'create' | 'edit'>('create');
  editingId = signal<string | null>(null);

  // Form State (Híbrido para ambos tipos)
  couponForm = signal<Partial<Coupon>>({
    code: '',
    discount: 0,
    type: 'PERCENT',
    isActive: true
  });

  membershipForm = signal<Partial<Membership>>({
    name: '',
    type: 'ILIMITADO',
    price: 0
  });

  setTab(tab: 'coupons' | 'memberships') {
    this.activeTab.set(tab);
  }

  openCreateModal() {
    this.modalMode.set('create');
    this.editingId.set(null);
    this.resetForms();
    this.isModalOpen.set(true);
  }

  openEditModal(item: Coupon | Membership) {
    this.modalMode.set('edit');
    this.editingId.set(item.id);
    
    if (this.activeTab() === 'coupons') {
      this.couponForm.set({ ...(item as Coupon) });
    } else {
      this.membershipForm.set({ ...(item as Membership) });
    }
    
    this.isModalOpen.set(true);
  }

  async saveItem() {
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
    }
  }

  private async saveCoupon() {
    const data = this.couponForm();
    if (this.modalMode() === 'create') {
      await this.couponService.addCoupon(data as Omit<Coupon, 'id'>);
    } else if (this.editingId()) {
      await this.couponService.updateCoupon(this.editingId()!, data);
    }
  }

  private async saveMembership() {
    const data = this.membershipForm();
    if (this.modalMode() === 'create') {
      await this.membershipService.addMembership(data as Omit<Membership, 'id'>);
    } else if (this.editingId()) {
      await this.membershipService.updateMembership(this.editingId()!, data);
    }
  }

  async deleteItem(id: string) {
    if (!confirm('¿Estás seguro de eliminar este elemento?')) return;
    
    try {
      if (this.activeTab() === 'coupons') {
        await this.couponService.deleteCoupon(id);
      } else {
        await this.membershipService.deleteMembership(id);
      }
      this.toastService.success('Eliminado correctamente');
    } catch (error: any) {
      this.toastService.error('Error al eliminar');
    }
  }

  private resetForms() {
    this.couponForm.set({
      code: '',
      discount: 0,
      type: 'PERCENT',
      isActive: true
    });
    this.membershipForm.set({
      name: '',
      type: 'ILIMITADO',
      price: 0
    });
  }
}
