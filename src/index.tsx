import React, { FC, useState, useCallback } from 'react'
import { render } from 'react-dom'
import { init, FieldExtensionSDK } from 'contentful-ui-extensions-sdk'
import '@contentful/forma-36-react-components/dist/styles.css'
import '@contentful/forma-36-fcss/dist/styles.css'
import './index.css'
import {
  Button,
  Dropdown,
  DropdownList,
  DropdownListItem,
} from '@contentful/forma-36-react-components'

interface AppProps {
  sdk: FieldExtensionSDK
}

const SidebarExtension: FC<AppProps> = (props: AppProps) => {
  const { sdk } = props
  const [env, setEnv] = useState(null)
  const [isOpen, setIsOpen] = useState(false)
  const [image, setImage] = useState(null)

  const tick = useCallback(() => {
    const {
      parameters: { installation },
    } = sdk
    const { gitlabBadgeUrlPreprod, gitlabBadgeUrlProduction } = installation
    const badgeUrl = env === 'preprod' ? gitlabBadgeUrlPreprod : gitlabBadgeUrlProduction
    setImage(`${badgeUrl}?date=${Date.now()}`)
  }, [sdk, env, setImage])

  const triggerUpdate = useCallback(() => {
    setInterval(tick, 10000)
  }, [tick])

  const onClick = useCallback(
    (open: Boolean) => {
      setIsOpen(open)
    },
    [setIsOpen]
  )

  const onToogle = useCallback(() => {
    onClick(!isOpen)
  }, [isOpen, onClick])

  const onButtonClick = useCallback(
    (environment) => {
      const {
        parameters: { installation },
      } = sdk

      const {
        gitlabBaseUrl,
        gitlabProjectId,
        gitlabPipelineTriggerToken,
        gitlabPipelineRefPreprod,
        gitlabPipelineRefProduction,
        gitlabBadgeUrlPreprod,
        gitlabBadgeUrlProduction,
      } = installation

      console.log(environment)
      const badgeUrl = environment === 'preprod' ? gitlabBadgeUrlPreprod : gitlabBadgeUrlProduction

      setEnv(environment)
      setImage(`${badgeUrl}?date=${Date.now()}`)
      setIsOpen(false)

      const pipelineUrl = `${gitlabBaseUrl}/projects/${gitlabProjectId}/trigger/pipeline`

      const formData = new FormData()
      formData.append('ref', environment === 'preprod' ? gitlabPipelineRefPreprod : gitlabPipelineRefProduction)
      formData.append('token', gitlabPipelineTriggerToken)
      formData.append('variables[PREVIEW]', '0')

      const pipelineOptions = {
        body: formData,
        method: 'POST',
        headers: {},
      }

      fetch(pipelineUrl, pipelineOptions)
        .then((r) => {
          if (r.ok) {
            sdk.notifier.success('Site en cours de déploiement...')
            setTimeout(() => {
              tick()
              triggerUpdate()
            }, 1000)
          } else {
            sdk.notifier.error('Impossible de déployer le site !')
          }
        })
        .catch((e) => {
          console.error('ERROR', pipelineUrl, pipelineOptions)
          console.error('ERROR', e)
          sdk.notifier.error('Impossible de déployer le site !')
        })
    },
    [setImage, setIsOpen, setEnv, sdk, tick, triggerUpdate]
  )

  return (
    <div className="container-width">
      <Dropdown
        isOpen={isOpen}
        isAutoalignmentEnabled={false}
        onClose={() => on(false)}
        isFullWidth={true}
        key={Date.now()}
        className="dropdownwidth"
        toggleElement={
          <Button
            buttonType="primary"
            isFullWidth={true}
            testId="build-button"
            indicateDropdown
            onClick={() => onToogle()}>
            Déploiement du site
          </Button>
        }>
        <DropdownList>
          <DropdownListItem onClick={() => onButtonClick('preprod')}>
            Environnement de preprod
          </DropdownListItem>
          <DropdownListItem onClick={() => onButtonClick('production')}>
            Environnement de production
          </DropdownListItem>
        </DropdownList>
      </Dropdown>

      <div className="container spacing-l">
        <img alt="" src={image} />
      </div>
    </div>
  )
}

init((sdk: FieldExtensionSDK) => {
  sdk.window.startAutoResizer()
  render(<SidebarExtension sdk={sdk} />, document.getElementById('root'))
})
