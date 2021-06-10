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


  const getUrlByEnvironnement = (environment)=>{
    const {
      parameters: { installation },
    } = sdk

    const {
      gitlabPipelinePreprod,
      gitlabPipelineStaging,
      gitlabPipelineProduction
    } = installation

    switch (environment) {
      case 'preprod':
        return gitlabPipelinePreprod
      case 'staging':
        return gitlabPipelineStaging
      default:
        return gitlabPipelineProduction
        break;
    }
  }


  const getBadgeByEnvironnement = (environment)=>{
    const {
      parameters: { installation },
    } = sdk
    const { gitlabBadgeUrlStaging, gitlabBadgeUrlPreprod, gitlabBadgeUrlProduction } = installation
    switch (environment){
      case 'preprod':
        return gitlabBadgeUrlPreprod
      case 'staging':
        return gitlabBadgeUrlStaging
      default:
        return gitlabBadgeUrlProduction
        break;
    }
  }

  const tick = useCallback((environment) => {

    const badgeUrl = getBadgeByEnvironnement(environment)

    setImage(`${badgeUrl}?date=${Date.now()}`)
  }, [sdk, setImage])

  const triggerUpdate = useCallback((environment) => {
    setInterval(() => {
      tick(environment)
    }, 10000)
  }, [tick])

  const onClick = useCallback((open: Boolean) => {
    setIsOpen(open)
  }, [setIsOpen])

  const onToogle = useCallback(() => {
    onClick(!isOpen)
  }, [isOpen, onClick])

  const onButtonClick = useCallback((environment) => {


    setIsOpen(false)

    const pipelineOptions = {
      method: 'POST',
    }

    const pipelineUrl = getUrlByEnvironnement(environment)

    fetch(pipelineUrl, pipelineOptions)
      .then((r) => {
        if (r.ok) {
          sdk.notifier.success('Site en cours de déploiement...')
          setTimeout(() => {
            tick(environment)
            triggerUpdate(environment)
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
  }, [sdk, setIsOpen, tick, triggerUpdate])

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
          <DropdownListItem onClick={() => onButtonClick('staging')}>
            Environnement de staging
          </DropdownListItem>
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
