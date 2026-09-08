import { IdCard, ImagePlus, KeyRound, MapPin, MapPinned, Phone, ToggleRight, UserRound } from 'lucide-react'
import { type FormEvent, useState } from 'react'
import { useQuery } from '@tanstack/react-query'
import { useTranslation } from 'react-i18next'
import { toast } from 'sonner'
import { FileDropField } from '../../components/ui/FileDropField'
import { SearchSelect } from '../../components/ui/SearchSelect'
import {
  AppForm,
  FormField,
  FormActions,
  ToggleField,
  fieldClassName,
} from '../../components/ui/Form'
import { FormCard, formCardBodyClassName } from '../../components/ui/FormLayout'
import { api, getApiErrorMessage, getImageUrl } from '../../lib/api'
import { toLatinDigits } from '../../lib/datetime'
import { useGeoName } from '../../lib/geo'
import { optimizeImageFile } from '../../lib/optimize-image'
import { sanitizeUsername } from '../../lib/identity'
import {
  userStatuses,
  type City,
  type Country,
  type ManagedUser,
  type Province,
  type UserStatus,
} from '../../types/app'

export type UserPayload = {
  username: string
  password?: string
  firstName: string
  lastName: string
  locale?: string
  status: UserStatus
  nationalId: string | null
  phone: string | null
  countryId: string | null
  provinceId: string | null
  cityId: string | null
  photoId: string | null
}

export function UserForm({
  initial,
  hidePassword = false,
  hideStatus = false,
  requirePassword = true,
  onCancel,
  onSubmit,
}: {
  initial?: ManagedUser
  hidePassword?: boolean
  hideStatus?: boolean
  requirePassword?: boolean
  onCancel: () => void
  onSubmit: (payload: UserPayload) => Promise<void>
}) {
  const { t } = useTranslation()
  const geoName = useGeoName()
  const [firstName, setFirstName] = useState(initial?.firstName ?? '')
  const [lastName, setLastName] = useState(initial?.lastName ?? '')
  const [username, setUsername] = useState(initial?.username ?? '')
  const [password, setPassword] = useState('')
  const [nationalId, setNationalId] = useState(initial?.nationalId ?? '')
  const [phone, setPhone] = useState(initial?.phone ?? '')
  const [countryId, setCountryId] = useState(initial?.countryId ?? '')
  const [provinceId, setProvinceId] = useState(initial?.provinceId ?? '')
  const [cityId, setCityId] = useState(initial?.cityId ?? '')
  const [status, setStatus] = useState<UserStatus>(initial?.status ?? userStatuses.ACTIVE)
  const [photoId, setPhotoId] = useState(initial?.photoId ?? '')
  const [photoPreview, setPhotoPreview] = useState(
    initial?.photoId ? getImageUrl(initial.photoId) : '',
  )
  const [saving, setSaving] = useState(false)

  const countries = useQuery({
    queryKey: ['countries', 'lookup'],
    queryFn: async () => {
      const { data } = await api.get<Country[]>('/countries', { params: { activeOnly: true } })
      return data
    },
  })
  const provinces = useQuery({
    queryKey: ['provinces', 'lookup', countryId],
    enabled: Boolean(countryId),
    queryFn: async () => {
      const { data } = await api.get<Province[]>('/provinces', {
        params: { countryId, activeOnly: true },
      })
      return data
    },
  })
  const cities = useQuery({
    queryKey: ['cities', 'lookup', provinceId],
    enabled: Boolean(provinceId),
    queryFn: async () => {
      const { data } = await api.get<City[]>('/cities', {
        params: { provinceId, activeOnly: true },
      })
      return data
    },
  })

  async function onPhoto(file: File) {
    try {
      const optimized = await optimizeImageFile(file)
      const body = new FormData()
      body.append('file', optimized)
      const { data } = await api.post<{ id: string }>('/images', body)
      setPhotoId(data.id)
      setPhotoPreview(getImageUrl(data.id))
    } catch (error) {
      toast.error(getApiErrorMessage(error, t('common.error')))
    }
  }

  async function submit(event: FormEvent) {
    event.preventDefault()
    setSaving(true)
    try {
      await onSubmit({
        username: sanitizeUsername(username),
        password: password || undefined,
        firstName: firstName.trim(),
        lastName: lastName.trim(),
        status,
        nationalId: nationalId.trim() || null,
        phone: phone.trim() || null,
        countryId: countryId || null,
        provinceId: provinceId || null,
        cityId: cityId || null,
        photoId: photoId || null,
      })
    } catch (error) {
      toast.error(getApiErrorMessage(error, t('common.error')))
    } finally {
      setSaving(false)
    }
  }

  return (
    <FormCard
      icon={UserRound}
      title={initial ? initial.fullName : t('users.create')}
      subtitle={initial ? undefined : t('users.createSubtitle')}
    >
      <AppForm onSubmit={submit} className={formCardBodyClassName}>
        <div className="grid gap-4 sm:grid-cols-2">
          <FormField icon={UserRound} label={t('users.firstName')} htmlFor="firstName">
            <input
              id="firstName"
              className={fieldClassName}
              value={firstName}
              onChange={(e) => setFirstName(e.target.value)}
              required
            />
          </FormField>
          <FormField icon={UserRound} label={t('users.lastName')} htmlFor="lastName">
            <input
              id="lastName"
              className={fieldClassName}
              value={lastName}
              onChange={(e) => setLastName(e.target.value)}
              required
            />
          </FormField>
          <FormField icon={IdCard} label={t('users.username')} htmlFor="username">
            <input
              id="username"
              className={`${fieldClassName} digit-field`}
              value={username}
              onChange={(e) => setUsername(sanitizeUsername(e.target.value))}
              required
              minLength={3}
              autoComplete="username"
            />
          </FormField>
          {hidePassword ? null : (
            <FormField icon={KeyRound} label={t('users.password')} htmlFor="password">
              <input
                id="password"
                type="password"
                className={fieldClassName}
                value={password}
                onChange={(e) => setPassword(e.target.value)}
                required={requirePassword}
                minLength={8}
                autoComplete={initial ? 'new-password' : 'new-password'}
                placeholder={initial ? t('users.passwordOptional') : undefined}
              />
            </FormField>
          )}
          <FormField icon={IdCard} label={t('users.nationalId')} htmlFor="nationalId">
            <input
              id="nationalId"
              className={`${fieldClassName} digit-field`}
              value={nationalId}
              onChange={(e) => setNationalId(toLatinDigits(e.target.value))}
            />
          </FormField>
          <FormField icon={Phone} label={t('users.phone')} htmlFor="phone">
            <input
              id="phone"
              className={`${fieldClassName} digit-field`}
              value={phone}
              onChange={(e) => setPhone(toLatinDigits(e.target.value))}
            />
          </FormField>
          <FormField icon={MapPinned} label={t('geo.country')} htmlFor="countryId">
            <SearchSelect
              id="countryId"
              value={countryId}
              onChange={(next) => {
                setCountryId(next)
                setProvinceId('')
                setCityId('')
              }}
              placeholder={t('geo.selectCountry')}
              options={[
                { value: '', label: t('geo.selectCountry') },
                ...(countries.data ?? []).map((item) => ({
                  value: item.id,
                  label: geoName(item),
                })),
              ]}
            />
          </FormField>
          <FormField icon={MapPinned} label={t('geo.province')} htmlFor="provinceId">
            <SearchSelect
              id="provinceId"
              value={provinceId}
              disabled={!countryId}
              onChange={(next) => {
                setProvinceId(next)
                setCityId('')
              }}
              placeholder={t('geo.selectProvince')}
              options={[
                { value: '', label: t('geo.selectProvince') },
                ...(provinces.data ?? []).map((item) => ({
                  value: item.id,
                  label: geoName(item),
                })),
              ]}
            />
          </FormField>
          <FormField icon={MapPin} label={t('geo.city')} htmlFor="cityId">
            <SearchSelect
              id="cityId"
              value={cityId}
              disabled={!provinceId}
              onChange={setCityId}
              placeholder={t('geo.selectCity')}
              options={[
                { value: '', label: t('geo.selectCity') },
                ...(cities.data ?? []).map((item) => ({
                  value: item.id,
                  label: geoName(item),
                })),
              ]}
            />
          </FormField>
        </div>
        {hideStatus ? null : (
          <FormField icon={ToggleRight} label={t('users.status')}>
            <ToggleField
              checked={status === userStatuses.ACTIVE}
              onChange={(checked) =>
                setStatus(checked ? userStatuses.ACTIVE : userStatuses.INACTIVE)
              }
              onLabel={t('geo.active')}
              offLabel={t('geo.inactive')}
            />
          </FormField>
        )}
        <FormField icon={ImagePlus} label={t('users.photo')}>
          <FileDropField
            accept="image/*"
            onFile={onPhoto}
            previewUrl={photoPreview}
            onClear={() => {
              setPhotoId('')
              setPhotoPreview('')
            }}
          />
        </FormField>
        <FormActions
          submitLabel={t('common.save')}
          submitting={saving}
          onCancel={onCancel}
        />
      </AppForm>
    </FormCard>
  )
}
