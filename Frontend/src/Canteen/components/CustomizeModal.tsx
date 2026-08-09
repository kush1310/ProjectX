/**
 * CustomizeModal — Item Customization Bottom Sheet
 *
 * Renders a Zomato-style dark-themed bottom sheet modal for configuring
 * menu item variants and add-on groups before adding to cart.
 *
 * Flow:
 *   1. User taps ADD on an item with hasVariants=true or hasAddons=true.
 *   2. This modal opens, showing variant selectors and addon group checkboxes.
 *   3. On "Add to Cart", calls the onConfirm callback with the selected
 *      variantId and addon option IDs.
 *
 * Validation:
 *   - Required addon groups (minSelection > 0) must meet their minimum before
 *     the "Add to Cart" button becomes active.
 *   - Each addon group enforces maxSelection; checkboxes are disabled once hit.
 *
 * @param isOpen     {boolean}          - Controls sheet visibility.
 * @param onClose    {() => void}       - Callback to close without adding.
 * @param item       {MenuItem | null}  - The item being customized. Null = closed.
 * @param onConfirm  {(variantId: string | null, addonIds: string[]) => void}
 *                                     - Callback invoked with selections on confirm.
 */

import { useState, useEffect, useMemo } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { X, Plus, Minus, Check } from 'lucide-react';
import type { MenuItem, MenuVariant, AddonOption } from '../types/menu';

interface CustomizeModalProps {
  isOpen:    boolean;
  onClose:   () => void;
  item:      MenuItem | null;
  onConfirm: (variantId: string | null, addonIds: string[], quantity: number) => void;
}

export default function CustomizeModal({
  isOpen,
  onClose,
  item,
  onConfirm,
}: CustomizeModalProps) {
  // Selected variant ID (null = no variant selected / single-price item)
  const [selectedVariant, setSelectedVariant] = useState<string | null>(null);
  // Selected addon option IDs keyed per group
  const [selectedAddons, setSelectedAddons]   = useState<Set<string>>(new Set());
  const [quantity,        setQuantity]         = useState(1);

  // Reset selections whenever the modal opens for a new item
  useEffect(() => {
    if (isOpen && item) {
      setSelectedVariant(item.variants?.[0]?.id ?? null);
      setSelectedAddons(new Set());
      setQuantity(1);
    }
  }, [isOpen, item?.id]);

  /**
   * toggleAddon
   *
   * Toggles an addon option within its group. Enforces maxSelection by
   * preventing selection when the group is already at capacity.
   *
   * @param groupId   {string} - The addon group this option belongs to.
   * @param optionId  {string} - The addon option ID to toggle.
   * @param maxSel    {number} - Maximum allowed selections for this group.
   */
  const toggleAddon = (groupId: string, optionId: string, maxSel: number) => {
    const key = `${groupId}::${optionId}`;
    setSelectedAddons(prev => {
      const next = new Set(prev);
      if (next.has(key)) {
        next.delete(key);
      } else {
        // Count current selections in this group
        const groupCount = [...next].filter(k => k.startsWith(`${groupId}::`)).length;
        if (groupCount < maxSel) next.add(key);
      }
      return next;
    });
  };

  /**
   * isConfirmAllowed
   *
   * Returns true only when all required addon groups have met their
   * minSelection constraint. Variant requirement is always satisfied
   * because we pre-select the first variant.
   */
  const isConfirmAllowed = useMemo(() => {
    if (!item) return false;
    return (item.addonGroups || []).every(group => {
      if (!group.required || group.minSelection === 0) return true;
      const groupCount = [...selectedAddons].filter(k => k.startsWith(`${group.id}::`)).length;
      return groupCount >= group.minSelection;
    });
  }, [item, selectedAddons]);

  /**
   * computeTotal
   *
   * Returns the total price for the configured item:
   *   base price (or selected variant price) + sum of selected addon prices,
   *   multiplied by quantity.
   */
  const computeTotal = useMemo((): number => {
    if (!item) return 0;
    let base = item.price;
    if (selectedVariant && item.variants) {
      const v = item.variants.find(v => v.id === selectedVariant);
      if (v) base = v.price;
    }
    let addonsTotal = 0;
    (item.addonGroups || []).forEach(group => {
      (group.options || []).forEach(opt => {
        if (selectedAddons.has(`${group.id}::${opt.id}`)) {
          addonsTotal += opt.price;
        }
      });
    });
    return (base + addonsTotal) * quantity;
  }, [item, selectedVariant, selectedAddons, quantity]);

  const handleConfirm = () => {
    if (!item || !isConfirmAllowed) return;
    // Extract just the option IDs (strip the groupId:: prefix)
    const addonOptionIds = [...selectedAddons].map(k => k.split('::')[1]);
    onConfirm(selectedVariant, addonOptionIds, quantity);
    onClose();
  };

  return (
    <AnimatePresence>
      {isOpen && item && (
        <>
          {/* Backdrop */}
          <motion.div
            key="backdrop"
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            onClick={onClose}
            className="fixed inset-0 z-50 bg-black/60 backdrop-blur-sm"
          />

          {/* Sheet \u2014 dark theme (Zomato customize sheet style) */}
          <motion.div
            key="sheet"
            initial={{ y: '100%' }}
            animate={{ y: 0 }}
            exit={{ y: '100%' }}
            transition={{ type: 'spring', stiffness: 380, damping: 38 }}
            className="fixed bottom-0 left-0 right-0 z-50 bg-[#1C1C1C] rounded-t-3xl shadow-2xl max-h-[85vh] overflow-y-auto sm:max-w-lg sm:mx-auto sm:bottom-6 sm:rounded-3xl"
          >
            {/* Handle */}
            <div className="flex justify-center pt-3 pb-1">
              <div className="w-10 h-1 bg-[#3A3A3A] rounded-full" />
            </div>

            {/* Header */}
            <div className="flex items-start justify-between px-5 pt-3 pb-4 border-b border-[#2C2C2C]">
              <div className="flex-1 min-w-0 pr-4">
                <h2 className="text-[17px] font-extrabold text-white leading-snug truncate">
                  {item.name}
                </h2>
                {item.description && (
                  <p className="text-[12px] text-[#8A8A8A] mt-0.5 line-clamp-2">{item.description}</p>
                )}
              </div>
              <button
                onClick={onClose}
                className="w-8 h-8 flex items-center justify-center rounded-full bg-[#2C2C2C] hover:bg-[#3A3A3A] transition-colors flex-shrink-0"
              >
                <X className="w-4 h-4 text-[#9C9C9C]" />
              </button>
            </div>

            <div className="px-5 pb-4 space-y-5 pt-4">
              {/* ── Variants Section ── */}
              {item.hasVariants && item.variants && item.variants.length > 0 && (
                <section>
                  <p className="text-[11px] font-extrabold text-[#9C9C9C] uppercase tracking-widest mb-3">
                    Size / Type
                    <span className="ml-1.5 text-[10px] normal-case font-normal text-[#5A5A5A]">(Required)</span>
                  </p>
                  <div className="space-y-2">
                    {item.variants.map((variant: MenuVariant) => {
                      const selected = selectedVariant === variant.id;
                      return (
                        <motion.button
                          key={variant.id}
                          whileTap={{ scale: 0.98 }}
                          onClick={() => setSelectedVariant(variant.id)}
                          className={`w-full flex items-center justify-between px-4 py-3 rounded-2xl border transition-all ${
                            selected
                              ? 'border-[#E23744] bg-[#E23744]/10'
                              : 'border-[#2C2C2C] bg-[#252525] hover:border-[#3A3A3A]'
                          }`}
                        >
                          <div className="flex items-center gap-3">
                            <div className={`w-5 h-5 rounded-full border-2 flex items-center justify-center flex-shrink-0 ${
                              selected ? 'border-[#E23744] bg-[#E23744]' : 'border-[#5A5A5A]'
                            }`}>
                              {selected && <div className="w-2 h-2 bg-white rounded-full" />}
                            </div>
                            <span className={`text-[13px] font-semibold ${selected ? 'text-white' : 'text-[#C0C0C0]'}`}>
                              {variant.name}
                            </span>
                          </div>
                          <span className={`text-[13px] font-bold ${selected ? 'text-[#E23744]' : 'text-[#9C9C9C]'}`}>
                            \u20b9{variant.price}
                          </span>
                        </motion.button>
                      );
                    })}
                  </div>
                </section>
              )}

              {/* ── Add-on Groups ── */}
              {item.hasAddons && (item.addonGroups || []).map(group => {
                const groupSelectedCount = [...selectedAddons].filter(k => k.startsWith(`${group.id}::`)).length;
                const isMaxed = groupSelectedCount >= group.maxSelection;

                return (
                  <section key={group.id}>
                    <div className="flex items-baseline gap-2 mb-3">
                      <p className="text-[11px] font-extrabold text-[#9C9C9C] uppercase tracking-widest">
                        {group.name}
                      </p>
                      <span className="text-[10px] text-[#5A5A5A] font-normal">
                        {group.required ? '(Required' : '(Optional'}
                        {group.maxSelection > 1 ? `, up to ${group.maxSelection})` : ')'}
                      </span>
                    </div>
                    <div className="space-y-2">
                      {(group.options || []).map((opt: AddonOption) => {
                        const key      = `${group.id}::${opt.id}`;
                        const checked  = selectedAddons.has(key);
                        const disabled = !checked && isMaxed;

                        return (
                          <motion.button
                            key={opt.id}
                            whileTap={{ scale: 0.98 }}
                            onClick={() => toggleAddon(group.id, opt.id, group.maxSelection)}
                            disabled={disabled}
                            className={`w-full flex items-center justify-between px-4 py-3 rounded-2xl border transition-all ${
                              checked
                                ? 'border-[#1BA672] bg-[#1BA672]/10'
                                : disabled
                                ? 'border-[#2C2C2C] bg-[#1E1E1E] opacity-40 cursor-not-allowed'
                                : 'border-[#2C2C2C] bg-[#252525] hover:border-[#3A3A3A]'
                            }`}
                          >
                            <div className="flex items-center gap-3">
                              <div className={`w-5 h-5 rounded-md border-2 flex items-center justify-center flex-shrink-0 ${
                                checked ? 'border-[#1BA672] bg-[#1BA672]' : 'border-[#5A5A5A]'
                              }`}>
                                {checked && <Check className="w-3 h-3 text-white" />}
                              </div>
                              <span className={`text-[13px] font-semibold ${checked ? 'text-white' : 'text-[#C0C0C0]'}`}>
                                {opt.name}
                              </span>
                            </div>
                            {opt.price > 0 && (
                              <span className={`text-[13px] font-bold ${checked ? 'text-[#1BA672]' : 'text-[#9C9C9C]'}`}>
                                +\u20b9{opt.price}
                              </span>
                            )}
                          </motion.button>
                        );
                      })}
                    </div>
                  </section>
                );
              })}

              {/* ── Quantity Stepper ── */}
              <section>
                <p className="text-[11px] font-extrabold text-[#9C9C9C] uppercase tracking-widest mb-3">Quantity</p>
                <div className="flex items-center gap-4">
                  <button
                    onClick={() => setQuantity(q => Math.max(1, q - 1))}
                    className="w-10 h-10 rounded-xl bg-[#2C2C2C] flex items-center justify-center hover:bg-[#3A3A3A] transition-colors"
                  >
                    <Minus className="w-4 h-4 text-white" />
                  </button>
                  <span className="text-[18px] font-black text-white min-w-[2ch] text-center">{quantity}</span>
                  <button
                    onClick={() => setQuantity(q => q + 1)}
                    className="w-10 h-10 rounded-xl bg-[#2C2C2C] flex items-center justify-center hover:bg-[#3A3A3A] transition-colors"
                  >
                    <Plus className="w-4 h-4 text-white" />
                  </button>
                </div>
              </section>
            </div>

            {/* Footer: total + Add to Cart */}
            <div className="sticky bottom-0 bg-[#1C1C1C] border-t border-[#2C2C2C] px-5 py-4">
              <motion.button
                whileTap={{ scale: 0.97 }}
                onClick={handleConfirm}
                disabled={!isConfirmAllowed}
                className={`w-full py-4 rounded-2xl text-[15px] font-black flex items-center justify-between px-5 transition-all ${
                  isConfirmAllowed
                    ? 'bg-[#E23744] text-white shadow-lg shadow-rose-900/30 hover:bg-[#C53030]'
                    : 'bg-[#2C2C2C] text-[#5A5A5A] cursor-not-allowed'
                }`}
              >
                <span>Add to Cart</span>
                <span className="text-[15px] font-black">\u20b9{computeTotal}</span>
              </motion.button>
            </div>
          </motion.div>
        </>
      )}
    </AnimatePresence>
  );
}
