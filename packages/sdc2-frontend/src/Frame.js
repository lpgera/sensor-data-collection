import { useContext, useState } from 'react'
import { HashRouter as Router, Switch, Route, Link } from 'react-router-dom'
import clsx from 'clsx'
import { makeStyles } from '@material-ui/core/styles'
import CssBaseline from '@material-ui/core/CssBaseline'
import Hidden from '@material-ui/core/Hidden'
import Drawer from '@material-ui/core/Drawer'
import AppBar from '@material-ui/core/AppBar'
import Slide from '@material-ui/core/Slide'
import useScrollTrigger from '@material-ui/core/useScrollTrigger'
import Toolbar from '@material-ui/core/Toolbar'
import List from '@material-ui/core/List'
import ListItem from '@material-ui/core/ListItem'
import ListItemIcon from '@material-ui/core/ListItemIcon'
import ListItemText from '@material-ui/core/ListItemText'
import DashboardIcon from '@material-ui/icons/Dashboard'
import KeyIcon from '@material-ui/icons/VpnKey'
import DiagnosticsIcon from '@material-ui/icons/LocalHospital'
import LogoutIcon from '@material-ui/icons/ExitToApp'
import Typography from '@material-ui/core/Typography'
import IconButton from '@material-ui/core/IconButton'
import Container from '@material-ui/core/Container'
import MenuIcon from '@material-ui/icons/Menu'
import { ReactComponent as Logo } from './logo.svg'
import { AuthContext } from './AuthContext'
import Login from './Login'
import Dashboard from './Dashboard'
import ApiKeys from './ApiKeys'
import Diagnostics from './Diagnostics'
import MeasurementChart from './MeasurementChart'
import useLocalStorage from './useLocalStorage'

const useStyles = makeStyles((theme) => ({
  root: {
    display: 'flex',
  },
  toolbar: {
    paddingRight: 24,
  },
  logo: {
    width: 24,
    height: 24,
    fill: 'white',
    marginRight: 8,
  },
  appBar: {
    zIndex: theme.zIndex.drawer + 1,
    transition: theme.transitions.create(['width', 'margin'], {
      easing: theme.transitions.easing.sharp,
      duration: theme.transitions.duration.leavingScreen,
    }),
  },
  menuButton: {
    marginRight: 16,
  },
  title: {
    flexGrow: 1,
  },
  drawerPaper: {
    position: 'relative',
    whiteSpace: 'nowrap',
    width: 180,
    transition: theme.transitions.create('width', {
      easing: theme.transitions.easing.sharp,
      duration: theme.transitions.duration.enteringScreen,
    }),
  },
  drawerPaperClose: {
    overflowX: 'hidden',
    width: 60,
    transition: theme.transitions.create('width', {
      easing: theme.transitions.easing.sharp,
      duration: theme.transitions.duration.leavingScreen,
    }),
  },
  appBarSpacer: theme.mixins.toolbar,
  content: {
    flexGrow: 1,
    minHeight: '100vh',
    overflow: 'auto',
  },
  container: {
    paddingBottom: theme.spacing(2),
  },
}))

function HideOnScroll({ children }) {
  const scrollTrigger = useScrollTrigger()
  return (
    <Slide appear={false} direction="down" in={!scrollTrigger}>
      {children}
    </Slide>
  )
}

export default function Frame() {
  const { state: authState, dispatch: authDispatch } = useContext(AuthContext)
  const [drawerOpen, setDrawerOpen] = useLocalStorage('sdc2-drawer-open', false)
  const [mobileDrawerOpen, setMobileDrawerOpen] = useState(false)

  const classes = useStyles()

  if (!authState.token) {
    return <Login />
  }

  const drawer = () => (
    <List>
      <ListItem
        button
        component={Link}
        to="/"
        onClick={() => setMobileDrawerOpen(false)}
      >
        <ListItemIcon>
          <DashboardIcon />
        </ListItemIcon>
        <ListItemText primary="Dashboard" />
      </ListItem>
      <ListItem
        button
        component={Link}
        to="/api-keys"
        onClick={() => setMobileDrawerOpen(false)}
      >
        <ListItemIcon>
          <KeyIcon />
        </ListItemIcon>
        <ListItemText primary="Api keys" />
      </ListItem>
      <ListItem
        button
        component={Link}
        to="/diagnostics"
        onClick={() => setMobileDrawerOpen(false)}
      >
        <ListItemIcon>
          <DiagnosticsIcon />
        </ListItemIcon>
        <ListItemText primary="Diagnostics" />
      </ListItem>
      <ListItem
        button
        onClick={() => {
          setMobileDrawerOpen(false)
          authDispatch({ type: 'logout' })
        }}
      >
        <ListItemIcon>
          <LogoutIcon />
        </ListItemIcon>
        <ListItemText primary="Logout" />
      </ListItem>
    </List>
  )

  return (
    <Router>
      <div className={classes.root}>
        <CssBaseline />
        <HideOnScroll>
          <AppBar className={classes.appBar}>
            <Toolbar className={classes.toolbar}>
              <IconButton
                edge="start"
                color="inherit"
                aria-label="open drawer"
                onClick={() => {
                  setDrawerOpen(!drawerOpen)
                  setMobileDrawerOpen(!mobileDrawerOpen)
                }}
                className={classes.menuButton}
              >
                <MenuIcon />
              </IconButton>
              <Logo className={classes.logo} />

              <Link to="/" style={{ color: 'white', textDecoration: 'none' }}>
                <Typography
                  component="h1"
                  variant="h6"
                  color="inherit"
                  noWrap
                  className={classes.title}
                >
                  Sensor data collection
                </Typography>
              </Link>
            </Toolbar>
          </AppBar>
        </HideOnScroll>

        <Hidden xsDown>
          <Drawer
            variant="permanent"
            classes={{
              paper: clsx(
                classes.drawerPaper,
                !drawerOpen && classes.drawerPaperClose
              ),
            }}
            open={drawerOpen}
          >
            <div className={classes.appBarSpacer} />
            {drawer()}
          </Drawer>
        </Hidden>
        <Hidden smUp>
          <Drawer
            classes={{
              paper: classes.drawerPaper,
            }}
            onClose={() => setMobileDrawerOpen(false)}
            open={mobileDrawerOpen}
          >
            {drawer()}
          </Drawer>
        </Hidden>
        <main className={classes.content}>
          <div className={classes.appBarSpacer} />
          <Container
            maxWidth="lg"
            className={classes.container}
            style={{ maxWidth: 1000, margin: '0 auto' }}
          >
            <Switch>
              <Route path="/api-keys">
                <ApiKeys />
              </Route>
              <Route path="/diagnostics">
                <Diagnostics />
              </Route>
              <Route path="/measurements">
                <MeasurementChart />
              </Route>
              <Route path="/">
                <Dashboard />
              </Route>
            </Switch>
          </Container>
        </main>
      </div>
    </Router>
  )
}
