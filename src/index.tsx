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
  const [image, setImage] = useState(null)
  const [isOpen, setIsOpen] = useState(false)
  const [buildEnv, setBuildEnv] = useState(null)

  const tick = useCallback(() => {
    const {
      parameters: { installation },
    } = sdk
console.error('tick() buildEnv', buildEnv)

    const { gitlabBadgeUrlPreprod, gitlabBadgeUrlProduction } = installation
    const badgeUrl = buildEnv === 'preprod' ? gitlabBadgeUrlPreprod : gitlabBadgeUrlProduction

    setImage(`${badgeUrl}?date=${Date.now()}`)
  }, [sdk, buildEnv, setImage])

  const triggerUpdate = useCallback(() => {
    setInterval(tick, 10000)
  }, [tick])

  const onClick = useCallback((open: Boolean) => {
    setIsOpen(open)
  }, [setIsOpen])

  const onToogle = useCallback(() => {
    onClick(!isOpen)
  }, [isOpen, onClick])

  const onButtonClick = useCallback((environment) => {
    const {
      parameters: { installation },
    } = sdk
console.error('onButtonClick() environment', environment)

    const {
      gitlabBaseUrl,
      gitlabProjectId,
      gitlabPipelineTriggerToken,
      gitlabPipelineRefPreprod,
      gitlabPipelineRefProduction,
    } = installation

    setIsOpen(false)
    setBuildEnv(environment)

    const pipelineUrl = `${gitlabBaseUrl}/projects/${gitlabProjectId}/trigger/pipeline`
    const pipelineRef = environment === 'preprod' ? gitlabPipelineRefPreprod : gitlabPipelineRefProduction

    const formData = new FormData()
    formData.append('ref', pipelineRef)
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
          console.error('ERROR', r)
          sdk.notifier.error('Impossible de déployer le site !')
        }
      })
      .catch((e) => {
        console.error('ERROR', pipelineUrl, pipelineOptions)
        console.error('ERROR', e)
        sdk.notifier.error('Impossible de déployer le site !')
      })
  }, [sdk, setIsOpen, setBuildEnv, tick, triggerUpdate])

  return (
    <div className="container-width">
      <Dropdown
        isOpen={isOpen}
        isAutoalignmentEnabled={false}
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
