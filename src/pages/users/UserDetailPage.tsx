import { IdCard, MapPin, Phone, UserRound } from 'lucide-react'
import { useQuery } from '@tanstack/react-query'
import { useTranslation } from 'react-i18next'
import { Link, useNavigate, useParams } from 'react-router-dom'
import { OpenUserPanelButton } from '../../components/auth/OpenUserPanelButton'
import {
  Button,
  DetailActions,
  EntityNameSubtitle,
  LoadingState,
  PageHeader,
  userFormShellClassName,
} from '../../components/ui/Form'
import {
  FormCard,
  FormFactTile,
  FormSectionTitle,
} from '../../components/ui/FormLayout'
import { useConfirmDelete } from '../../hooks/useConfirmDelete'
import { api, getImageUrl } from '../../lib/api'
import { useGeoName } from '../../lib/geo'
import { publicProfilePath } from '../../lib/public-profile'
import type { ManagedUser } from '../../types/app'
import { GeoStatus } from '../geo/GeoShared'

export function UserDetailPage() {
  const { t } = useTranslation()
  const { id } = useParams()
  const navigate = useNavigate()
  const geoName = useGeoName()
  const { confirmDelete } = useConfirmDelete()
  const query = useQuery({
    queryKey: ['user', id],
    enabled: Boolean(id),
    queryFn: async () => {
      const { data } = await api.get<ManagedUser>(`/users/${id}`)
      return data
    },
  })

  const user = query.data
  if (!user) {
    return <LoadingState />
  }

  return (
    <div className={userFormShellClassName}>
      <PageHeader
        title={t('users.details')}
        subtitle={<EntityNameSubtitle name={user.fullName} icon={UserRound} />}
      />
      <FormCard
        icon={UserRound}
        title={user.fullName}
        action={<OpenUserPanelButton userId={user.id} status={user.status} />}
      >
        <div className="space-y-6 p-5 sm:p-6">
          {user.photoId ? (
            <img
              src={getImageUrl(user.photoId)}
              alt=""
              className="size-24 rounded-2xl object-cover ring-1 ring-teal-100"
            />
          ) : null}
          <FormSectionTitle icon={UserRound}>{t('users.tabs.personal')}</FormSectionTitle>
          <div className="grid gap-2 sm:grid-cols-2 sm:gap-3">
            <FormFactTile icon={IdCard} label={t('users.username')} value={user.username} tone="teal" />
            <FormFactTile
              icon={IdCard}
              label={t('users.nationalId')}
              copyValue={user.nationalId}
              tone="mint"
            />
            <FormFactTile icon={Phone} label={t('users.phone')} copyValue={user.phone} />
            <FormFactTile
              icon={MapPin}
              label={t('geo.city')}
              value={[user.country, user.province, user.city].filter(Boolean).map((item) => geoName(item!)).join(' · ') || '—'}
            />
            <FormFactTile
              icon={UserRound}
              label={t('users.status')}
              value={<GeoStatus active={user.status === 'ACTIVE'} />}
            />
          </div>
          <DetailActions
            editTo={`/users/${user.id}/edit`}
            editLabel={t('common.edit')}
            deleteLabel={t('users.delete')}
            onDelete={() =>
              confirmDelete({
                message: t('users.confirmDelete'),
                successMessage: t('users.deleted'),
                path: `/users/${user.id}`,
                queryKey: ['users'],
                onDeleted: () => navigate('/users'),
              })
            }
            extra={
              <div className="flex flex-wrap gap-2">
                <Link to={`/users/${user.id}/location`}>
                  <Button type="button" variant="soft">
                    <MapPin className="size-4" aria-hidden />
                    {t('location.register')}
                  </Button>
                </Link>
                <Link to={publicProfilePath(user.id)}>
                  <Button type="button" variant="ghost">
                    <IdCard className="size-4" aria-hidden />
                    {t('nav.publicCard')}
                  </Button>
                </Link>
              </div>
            }
          />
        </div>
      </FormCard>
    </div>
  )
}
