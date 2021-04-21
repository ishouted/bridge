<template>
  <!-- 分页 -->
  <div class="paging" v-show="pager.total>pager.rows || show">
    <el-pagination
            class="pages"
            background
            small
            layout="total,prev, pager, next, jumper"
            :total="pager.total"
            :current-page.sync="pager.page"
            :page-size="pager.rows"
            :pager-count=5
            @size-change="onChangeSize"
            @current-change="onChangePage">
    </el-pagination>
  </div>
</template>

<script>
  export default {
    props: {
      pager: Object,
      show: {
        type: Boolean,
        default: false
      }
    },
    methods: {
      // 每页条数
      onChangeSize(rows) {
        console.log(rows);
        // this.pager.rows = rows;
        this.$emit('change');
      },
      // 翻页
      onChangePage(page) {
        console.log(page);
        // console.log(this.pager, 777)
        // this.pager.page = page;
        this.$emit('change');
      },
    },
  };
</script>

<style lang="less">
  @import "../assets/css/style";

  .paging {
    .pages {
      margin: 15px 0 10px 0;
      text-align: right;
      height: 50px;
      .el-pager {
        .active {
          background-color: @Ncolour !important;
        }
      }
      .el-pagination__jump {
      }
    }
    @media screen and (max-width: 1200px) {
      .pages {
        .el-pagination__jump {
          display: none;
        }
      }
    }
  }
</style>

