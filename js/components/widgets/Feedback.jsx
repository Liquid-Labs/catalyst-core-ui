import React, { createContext, useCallback, useContext, useMemo, useRef } from 'react'
import PropTypes from 'prop-types'

import { CatalystSpinner, CatalystBlocker } from '../widgets/CatalystWaiterDisplay'
import CheckCircleIcon from '@material-ui/icons/CheckCircle'
import CloseIcon from '@material-ui/icons/Close'
import ErrorIcon from '@material-ui/icons/Error'
import InfoIcon from '@material-ui/icons/Info'
import { SnackbarProvider, withSnackbar } from 'notistack'
import { TinyIconButton } from '@liquid-labs/mui-extensions'
import WarningIcon from '@material-ui/icons/Warning'

import { useTheme, makeStyles } from '@material-ui/styles'

import { withStyles } from '@material-ui/core/styles'

import { catalystFollowupHandler } from '../../utils/catalystFollowupHandler'
import { waiterSettings } from '@liquid-labs/react-waiter'

const dismissStyles = (theme) => ({
  close : {
    width  : theme.spacing.unit * 4,
    height : theme.spacing.unit * 4,
  }
})

const styles = theme => ({
  // allow our snackbars to take up most of the space
  snackItemRoot : {
    flex                         : '0 0 auto',
    maxWidth                     : 'none',
    [theme.breakpoints.up('sm')] : {
      maxWidth : '90vw'
    },
    [theme.breakpoints.up('md')] : {
      maxWidth : '80vw'
    },
    [theme.breakpoints.up('xl')] : {
      maxWidth : '60vw'
    },
  },

  snackItemInfo : {
    backgroundColor : theme.palette.info.main,
    color           : theme.palette.info.contrast,
  }
})

const FeedbackContext = createContext()

const useFeedbackAPI = () => useContext(FeedbackContext)

const useDismissStyles = makeStyles(dismissStyles)

const DismissButton = ({messageKey, closeMessage}) => {
  const classes = useDismissStyles()
  return (
    <TinyIconButton
        aria-label="Close"
        color="inherit"
        className={classes.close}
        onClick={() => closeMessage(messageKey) }
    >
      <CloseIcon />
    </TinyIconButton>
  )
}

const closeAction = (closeMessage) => (key) =>
  <DismissButton messageKey={key} closeMessage={closeMessage} />

const FeedbackProvider = withSnackbar(
  ({autoHideDuration, warningHideFactor, enqueueSnackbar, closeSnackbar, children}) => {
    const action = closeAction(closeSnackbar)
    const incAction = (persist, options) => {
      if (options?.action) return action
      else {
        const optPersist = options?.persist
        if (optPersist) return action
        else if (optPersist === undefined && persist) return action
        else return null
      }
      (options?.action
        || (options?.persist || (options?.persist === undefined && persist)
            && action))
    }

    // 'enqueueSnackbar' changes with ever render. Which means we can't rely on
    // it as an indicator when to recalculate the 'addInfoMessage', etc.
    // Luckily, it appears that we don't have to; even though the function
    // changes, the 'old' ones continue to work.
    const addInfoMessage = useCallback((message, options) =>
      enqueueSnackbar(message, Object.assign(
        { persist : false, variant : 'info', autoHideDuration, action: incAction(false, options) },
        options)),
    [ /* enqueueSnackbar */ ])
    const addConfirmMessage = useCallback((message, options) =>
      enqueueSnackbar(message, Object.assign(
        { persist : false, variant : 'success', autoHideDuration, action: incAction(false, options) },
        options)),
    [ /* enqueueSnackbar */ ])
    const addWarningMessage = useCallback((message, options) =>
      enqueueSnackbar(message, Object.assign(
        { persist          : false,
          variant          : 'warning',
          autoHideDuration : autoHideDuration * warningHideFactor,
          action           : incAction(false, options) },
        options)),
    [ /* enqueueSnackbar */ ])
    const addErrorMessage = useCallback((message, options) =>
      enqueueSnackbar(message, Object.assign(
        { persist : true, variant : 'error', action: incAction(true, options) },
        options)),
    [ /* enqueueSnackbar */ ])
    const closeMessage = useCallback((key) => closeSnackbar(key), [])
    const currMsgKey = useRef()
    const theme = useTheme()
    // The memo is doing two things; since the currMsgKey ref and 'theme' should
    // rarely if ever change (currMsgKey is the same by def) and the feedbackAPI
    // only need be updated on mount, we can use one memo calculation instead
    // of two.
    const feedbackAPI = useMemo(() => {
      const api = {
        addInfoMessage,
        addConfirmMessage,
        addWarningMessage,
        addErrorMessage,
        closeMessage
      }
      const followupHandler = catalystFollowupHandler(api, theme, currMsgKey)

      waiterSettings.setDefaultSpinner(CatalystSpinner)
      waiterSettings.setDefaultBlocker(CatalystBlocker)
      waiterSettings.setDefaultFollowupHandler(followupHandler)
      return api
    }, [ theme ]) /* , addInfoMessage, addConfirmMessage, addWarningMessage, addErrorMessage */

    return (
      <FeedbackContext.Provider value={feedbackAPI}>
        {children}
      </FeedbackContext.Provider>
    )
  }
)

const defaultAutoHideDuration = 2000 // miliseconds

const defaultWarningHideFactor = 1.5

const defaultSnackAnchor = {
  vertical   : 'top',
  horizontal : 'center',
}

const iconStyle = {
  marginRight : '0.25em',
  height      : '0.8em'
}

// use standard material icons
const iconVariant = {
  success : <CheckCircleIcon style={iconStyle} />,
  info    : <InfoIcon style={iconStyle} />,
  error   : <ErrorIcon style={iconStyle} />,
  warning : <WarningIcon style={iconStyle} />
}

const Feedback = withStyles(styles, { name : 'Feedback' })(({
  id='appMessages',
  autoHideDuration=defaultAutoHideDuration,
  anchorOrigin=defaultSnackAnchor,
  warningHideFactor=defaultWarningHideFactor,
  children, classes, ...props}) => {
  return (
    <SnackbarProvider
        anchorOrigin={anchorOrigin}
        iconVariant={iconVariant}
        ContentProps={{ classes : {
          root : classes.snackItemRoot,
        }}}
        classes={{ variantInfo : classes.snackItemInfo }}
        {...props}>
      <FeedbackProvider autoHideDuration={autoHideDuration}
          warningHideFactor={warningHideFactor}>
        {children}
      </FeedbackProvider>
    </SnackbarProvider>
  )
})

Feedback.propTypes = {
  children             : PropTypes.PropTypes.node,
  infoAutoHideDuration : PropTypes.number,
  anchorOrigin         : PropTypes.object,
}

export {
  Feedback,
  FeedbackContext, // TODO: deprecate
  useFeedbackAPI
}
