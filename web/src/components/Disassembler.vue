<template>
  <div>
    <div
      v-if="loading"
      class="loading"
    >
      <Loading />
    </div>

    <div v-if="notFound">
      <NotFound />
    </div>

    <div
      v-if="!loading && !notFound"
      class="disassembler"
    >
      <MenuBar />
      <div style="position:absolute; top:60px; left: 20px; right: 20px; height: 20px;">
        <AddressBar />
      </div>
      <div
        style="border-top: 1px solid #c0c0c0; border-bottom: 1px solid #c0c0c0; position: absolute; top: 120px; right: 0px; bottom: 20px; left: 0px; "
      >
        <SplitBox split-x="400">
          <div slot="left">
            <div v-if="liveMode">
              <LiveEntry />
            </div>
            <div v-else>
              <FileSidebar />
            </div>
          </div>

          <div slot="center">
            <!-- <b-card no-body class="here">
              <b-tabs card>
                <b-tab title="Tab 1" active>
                  <div style="position:absolute; left:0;right:0;top:32px;bottom:0;">
                    <Listing></Listing>
                  </div>
                </b-tab>
                <b-tab title="Graph">
                  <br>I'm the graph
                </b-tab>
                <b-tab title="Hex">
                  <br>I'm the hex
                </b-tab>
                <b-tab title="Sections">
                  <br>I'm the sections
                </b-tab>
                <b-tab title="File Info">
                  <br>I'm the file info
                </b-tab>
              </b-tabs>
            </b-card>  -->

            <b-tabs
              v-model="tabIndex"
              style="margin-left:5px;"
            >
              <b-tab
                title="Disassembly"
                active
              >
                <div style="position:absolute; left:0;right:0;top:45px;bottom:0;">
                  <Listing />
                </div>
              </b-tab>
              <b-tab title="Graph">
                <div style="position:absolute; left:0;right:0;top:45px;bottom:0;">
                  <GraphView :visible="graphVisible" />
                </div>
              </b-tab>
              <b-tab title="Hex">
                <HexView />
              </b-tab>
              <b-tab title="Sections">
                <div style="position:absolute; top:42px; left:0; right:0; bottom:0; overflow: scroll;">
                  <Sections />
                </div>
              </b-tab>
              <b-tab title="File Info">
                <div style="position:absolute; top:32px; left:0; right:0; bottom:0; overflow: scroll;">
                  <FileInfo />
                </div>
              </b-tab>
              <b-tab lazy title="Call Graph">
                <div style="position:absolute; top:32px; left:0; right:0; bottom:0; overflow: scroll;">
                  <CallGraph />
                </div>
              </b-tab>
              
            </b-tabs>

            <!-- <SplitBox splitX="600">
              <div slot="left">
                <Listing></Listing>
              </div>
            </SplitBox>  -->
          </div>

          <!-- <div
            slot="right"
            class="decompiler"
          >
            <Decompiler />
          </div> -->
        </SplitBox>
      </div>
      <StatusBar />
    </div>

    <UploadFileModal />
    <ConfigureUploadModal />
    <SharingModal />
    <CommentModal />
    <GotoAddressModal />
    <EditFunctionModal />
    <DefinedDataModal />
  </div>
</template>

<script>
import GotoAddressModal from './modals/GotoAddressModal'
import Loading from './Loading'
import EditFunctionModal from './modals/EditFunctionModal'
import DefinedDataModal from './modals/DefinedDataModal'
import NotFound from './NotFound'

import * as types from '@/store/mutation-types.js'

import { mapState } from 'vuex'
import { copyOdaMaster, canEdit } from '../api/oda'
import { OPEN_LISTING_TAB, bus } from '../bus'


export default {
  name: 'DisassemblerView',
  components: {
    MenuBar: () => import('@/components/MenuBar'),
    SplitBox: () => import('@/components/SplitBox'),
    Listing: () => import('@/components/Listing'),
    AddressBar: () => import('@/components/AddressBar'),
    FileSidebar: () => import('@/components/FileSidebar'),
    FileInfo: () => import('@/components/tabs/FileInfo'),
    Sections: () => import('@/components/tabs/Sections'),
    HexView: () => import('@/components/tabs/HexView'),
    LiveEntry: () => import('./sidebar/LiveEntry'),
    UploadFileModal: () => import('@/components/modals/UploadFileModal'),
    ConfigureUploadModal: () => import('@/components/modals/ConfigureUploadModal'),
    GraphView: () => import('@/components/tabs/GraphView'),
    CallGraph: () => import('@/components/tabs/CallGraph'),
    SharingModal: () => import('@/components/modals/SharingModal'),
    StatusBar: () => import('./StatusBar'),
    CommentModal: () => import('@/components/modals/CommentModal'),
    // Decompiler,
    Loading,
    GotoAddressModal,
    EditFunctionModal,
    DefinedDataModal,
    NotFound
  },
  data () {
    return {
      notFound: null,
      loading: true,
      tabIndex: 0,
      graphVisible: false
    }
  },
  computed: mapState([
    'liveMode'
  ]),
  watch: {
    // call again the method if the route changes
    $route: 'fetchData',
    tabIndex () {
      this.graphVisible = (this.tabIndex === 1)
    }
  },
  created () {
    // fetch the data when the view is created and the data is
    // already being observed
    this.fetchData()

    bus.$on(OPEN_LISTING_TAB, () => { this.tabIndex = 0 })
  },
  methods: {
    async fetchData () {
      this.loading = true
      const shortName = this.$route.params.shortName
      let own = null
      try {
        own = await canEdit(shortName)
      } catch (e) {
        this.loading = false
        this.notFound = true
        return
      }

      if (!own) {
        try {
          const { short_name: copiedShortName, binary_bytes: binaryBytes } = await copyOdaMaster(shortName)
          this.$store.commit(types.LOAD_BINARY, { binaryBytes })
          this.$router.replace('/odaweb/' + copiedShortName)
          return
        } catch (e) {
          this.notFound = true
          return
        }
      }

      this.$store.commit(types.SET_SHORTNAME, { shortName: shortName })
      await this.$store.dispatch('loadOdbFile')
      this.loading = false
      this.notFound = false
    }
  }
}
</script>

<!-- Add "scoped" attribute to limit CSS to this component only -->
<style scoped>
  ::v-deep .nav-link {
    padding: 3px 18px;
    font-size: 14px;
  }

  ::v-deep .nav-tabs {
    padding-top: 2px;
    padding-left: 6px;
  }

  ::v-deep .nav-item a {
    color: #b5b5b5;
    font-size: 1rem;
  }

  ::v-deep .card-header {
    padding: 0.15rem 1.25rem 0.75rem 1.25rem;
  }
</style>
