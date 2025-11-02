import { useState } from 'react'
import { Dialog, DialogContent, DialogHeader, DialogTitle } from './dialog'
import { Input } from './input'
import { Label } from './label'
import { Button } from './button'
import { CreditCard } from 'lucide-react'

type PaymentSystem = 'Visa' | 'MasterCard' | 'Mir' | 'American Express' | 'Неизвестна'

interface PaymentDialogProps {
  open: boolean
  onOpenChange: (open: boolean) => void
  transportPrice: number
  insurancePrice: number
  onConfirm: () => void
  isPending?: boolean
}

export function PaymentDialog({ 
  open, 
  onOpenChange, 
  transportPrice, 
  insurancePrice, 
  onConfirm,
  isPending = false
}: PaymentDialogProps) {
  const [cardNumber, setCardNumber] = useState('')
  const [expiryDate, setExpiryDate] = useState('')
  const [cvv, setCvv] = useState('')
  const [cardHolder, setCardHolder] = useState('')

  const totalPrice = transportPrice + insurancePrice

  const formatCardNumber = (value: string): string => {
    const numbers = value.replace(/\D/g, '').slice(0, 16)
    const groups = numbers.match(/.{1,4}/g)
    return groups ? groups.join(' ') : numbers
  }

  const formatExpiryDate = (value: string): string => {
    const numbers = value.replace(/\D/g, '').slice(0, 4)
    if (numbers.length >= 2) {
      return `${numbers.slice(0, 2)}/${numbers.slice(2)}`
    }
    return numbers
  }

  const getPaymentSystem = (cardNumber: string): PaymentSystem => {
    const firstDigit = cardNumber.replace(/\s/g, '')[0]
    switch (firstDigit) {
      case '4':
        return 'Visa'
      case '5':
        return 'MasterCard'
      case '2':
        return 'Mir'
      case '3':
        return 'American Express'
      default:
        return 'Неизвестна'
    }
  }

  const handleCardNumberChange = (value: string) => {
    setCardNumber(formatCardNumber(value))
  }

  const handleExpiryDateChange = (value: string) => {
    setExpiryDate(formatExpiryDate(value))
  }

  const handleCvvChange = (value: string) => {
    const numbers = value.replace(/\D/g, '').slice(0, 3)
    setCvv(numbers)
  }

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault()
    onConfirm()
  }

  const paymentSystem = cardNumber ? getPaymentSystem(cardNumber) : null

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="backdrop-blur-xl bg-black/95 border-white/20 text-white max-w-md">
        <DialogHeader>
          <DialogTitle className="text-white flex items-center gap-2">
            <CreditCard className="h-5 w-5" />
            Оплата заказа
          </DialogTitle>
        </DialogHeader>

        <div className="space-y-6">
          {/* Price Breakdown */}
          <div className="backdrop-blur-md bg-white/5 border border-white/10 rounded-xl p-4 space-y-2">
            <div className="flex justify-between text-sm">
              <span className="text-white/60">Цена перевозки:</span>
              <span className="text-white">{transportPrice.toLocaleString('ru-RU')} ₽</span>
            </div>
            <div className="flex justify-between text-sm">
              <span className="text-white/60">Цена страховки:</span>
              <span className="text-white">{insurancePrice.toLocaleString('ru-RU')} ₽</span>
            </div>
            <div className="border-t border-white/20 pt-2 mt-2">
              <div className="flex justify-between font-semibold">
                <span className="text-white">Общая сумма:</span>
                <span className="text-white text-lg">{totalPrice.toLocaleString('ru-RU')} ₽</span>
              </div>
            </div>
          </div>

          {/* Payment Form */}
          <form onSubmit={handleSubmit} className="space-y-4">
            <div className="space-y-2">
              <Label htmlFor="cardNumber" className="text-white/60">
                Номер карты
              </Label>
              <div className="relative">
                <Input
                  id="cardNumber"
                  type="text"
                  placeholder="1234 5678 9012 3456"
                  value={cardNumber}
                  onChange={(e) => handleCardNumberChange(e.target.value)}
                  className="bg-white/10 border-white/20 text-white placeholder:text-white/40"
                  required
                />
                {paymentSystem && paymentSystem !== 'Неизвестна' && (
                  <div className="absolute right-3 top-1/2 -translate-y-1/2 text-xs text-white/80 bg-white/10 px-2 py-1 rounded">
                    {paymentSystem}
                  </div>
                )}
              </div>
            </div>

            <div className="grid grid-cols-2 gap-4">
              <div className="space-y-2">
                <Label htmlFor="expiryDate" className="text-white/60">
                  Срок действия
                </Label>
                <Input
                  id="expiryDate"
                  type="text"
                  placeholder="MM/YY"
                  value={expiryDate}
                  onChange={(e) => handleExpiryDateChange(e.target.value)}
                  className="bg-white/10 border-white/20 text-white placeholder:text-white/40"
                  required
                />
              </div>

              <div className="space-y-2">
                <Label htmlFor="cvv" className="text-white/60">
                  CVV
                </Label>
                <Input
                  id="cvv"
                  type="text"
                  placeholder="123"
                  value={cvv}
                  onChange={(e) => handleCvvChange(e.target.value)}
                  className="bg-white/10 border-white/20 text-white placeholder:text-white/40"
                  required
                />
              </div>
            </div>

            <div className="space-y-2">
              <Label htmlFor="cardHolder" className="text-white/60">
                Имя на карте {paymentSystem === 'Mir' && <span className="text-white/40">(необязательно)</span>}
              </Label>
              <Input
                id="cardHolder"
                type="text"
                placeholder="IVAN IVANOV"
                value={cardHolder}
                onChange={(e) => setCardHolder(e.target.value.toUpperCase())}
                className="bg-white/10 border-white/20 text-white placeholder:text-white/40"
                required={paymentSystem !== 'Mir'}
              />
            </div>

            <div className="pt-4">
              <Button
                type="submit"
                disabled={isPending}
                className="w-full bg-white text-black hover:bg-gray-200"
              >
                {isPending ? 'Обработка...' : 'Оплатить'}
              </Button>
            </div>

            <p className="text-xs text-white/40 text-center">
              Это демо-режим. Все оплаты считаются успешными.
            </p>
          </form>
        </div>
      </DialogContent>
    </Dialog>
  )
}

