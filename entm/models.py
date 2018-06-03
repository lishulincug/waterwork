# -*- coding: utf-8 -*-
from __future__ import unicode_literals

from django.db import models
from django.urls import reverse

# Create your models here.

class Organizations(models.Model):
    name               = models.CharField('组织机构名称',max_length=300,null=True)
    attribute          = models.CharField('组织机构性质',max_length=300,null=True,blank=True)
    register_date      = models.DateField('注册日期',max_length=300,null=True,blank=True)
    owner_name         = models.CharField('负责人',max_length=300,null=True,blank=True)
    phone_number       = models.CharField('电话号码',max_length=300,null=True,blank=True)
    firm_address       = models.CharField('地址',max_length=300,null=True,blank=True)

    cid           = models.CharField(max_length=300,null=True,blank=True)
    pId           = models.CharField(max_length=300,null=True,blank=True)
    is_org        = models.BooleanField(max_length=300,blank=True)
    uuid          = models.CharField(max_length=300,null=True,blank=True)


    class Meta:
        managed = True
        db_table = 'organizations'

        permissions = (
            # 数据监控 sub
            ('perms_datamonitor','数据监控'),
            ('mapmonitor_perms_datamonitor','地图监控'),
            ('mapmonitor_perms_datamonitor_edit','地图监控_可写'),
            ('realcurlv_perms_datamonitor','实时曲线'),
            ('realcurlv_perms_datamonitor_edit','实时曲线_可写'),
            ('realdata_perms_datamonitor','实时数据'),
            ('realdata_perms_datamonitor_edit','实时数据_可写'),
            ('dmaonline_perms_datamonitor','DMA在线监控'),
            ('dmaonline_perms_datamonitor_edit','DMA在线监控_可写'),

            # 数据分析 sub
            ('perms_datanalys','数据分析'),
            ('dailyuse_perms_datanalys','日用水分析'),
            ('dailyuse_perms_datanalys_edit','日用水分析_可写'),
            ('monthlyuse_perms_datanalys','月用水分析'),
            ('monthlyuse_perms_datanalys_edit','月用水分析_可写'),
            ('dmacxc_perms_datanalys','DMA产销差分析'),
            ('dmacxc_perms_datanalys_edit','DMA产销差分析_可写'),
            ('flownalys_perms_datanalys','流量分析'),
            ('flownalys_perms_datanalys_edit','流量分析_可写'),
            ('comparenalys_perms_datanalys','对比分析'),
            ('comparenalys_perms_datanalys_edit','对比分析_可写'),
            ('peibiao_perms_datanalys','配表分析'),
            ('peibiao_perms_datanalys_edit','配表分析_可写'),
            ('rawdata_perms_datanalys','原始数据'),
            ('rawdata_perms_datanalys_edit','原始数据_可写'),
            ('mnf_perms_datanalys','夜间最小流量'),
            ('mnf_perms_datanalys_edit','夜间最小流量_可写'),

            # 报警中心 sub
            ('perms_alarmcenter','报警中心'),
            ('stationalarm_perms_alarmcenter','站点报警设置'),
            ('stationalarm_perms_alarmcenter_edit','站点报警设置_可写'),
            ('dmaalarm_perms_alarmcenter','DMA报警设置'),
            ('dmaalarm_perms_alarmcenter_edit','DMA报警设置_可写'),
            ('queryalarm_perms_alarmcenter','报警查询'),
            ('queryalarm_perms_alarmcenter_edit','报警查询_可写'),

            # 基础管理 sub
            ('perms_basemanager','基础管理'),
            ('dmamanager_perms_basemanager','dma管理'),
            ('dmamanager_perms_basemanager_edit','dma管理_可写'),
            ('stationmanager_perms_basemanager','站点管理'),
            ('stationmanager_perms_basemanager_edit','站点管理_可写'),

            # 企业管理 sub
            ('perms_firmmanager','企业管理'),
            ('rolemanager_perms_firmmanager','角色管理'),
            ('rolemanager_perms_firmmanager_edit','角色管理_可写'),
            ('organusermanager_perms_basemanager','组织和用户管理'),
            ('organusermanager_perms_basemanager_edit','组织和用户管理_可写'),

            # 设备管理 sub
            ('perms_devicemanager','设备管理'),
            ('meters_perms_devicemanager','表具管理'),
            ('meters_perms_devicemanager_edit','表具管理_可写'),
            ('simcard_perms_devicemanager','SIM卡管理'),
            ('simcard_perms_devicemanager_edit','SIM卡管理_可写'),
            ('params_perms_devicemanager','参数指令'),
            ('params_perms_devicemanager_edit','参数指令_可写'),

            # 基准分析 sub
            ('perms_basenalys','基准分析'),
            ('dma_perms_basenalys','DMA基准分析'),
            ('dma_perms_basenalys_edit','DMA基准分析_可写'),
            ('mf_perms_basenalys','最小流量分析'),
            ('mf_perms_basenalys_edit','最小流量分析_可写'),
            ('day_perms_basenalys','日基准流量分析'),
            ('day_perms_basenalys_edit','日基准流量分析_可写'),

            # 统计报表 sub
            ('perms_reporttable','统计报表'),
            ('querylog_perms_reporttable','日志查询'),
            ('querylog_perms_reporttable_edit','日志查询_可写'),
            ('alarm_perms_reporttable','报警报表'),
            ('alarm_perms_reporttable_edit','报警报表_可写'),
            ('dmastatics_perms_reporttable','DMA统计报表'),
            ('dmastatics_perms_reporttable_edit','DMA统计报表_可写'),
            ('biguser_perms_reporttable','大用户报表'),
            ('biguser_perms_reporttable_edit','大用户报表_可写'),
            ('flows_perms_reporttable','流量报表'),
            ('flows_perms_reporttable_edit','流量报表_可写'),
            ('waters_perms_reporttable','水量报表'),
            ('waters_perms_reporttable_edit','水量报表_可写'),
            ('biaowu_perms_reporttable','表务报表'),
            ('biaowu_perms_reporttable_edit','表务报表_可写'),
            ('bigdata_perms_reporttable','大数据报表'),
            ('bigdata_perms_reporttable_edit','大数据报表_可写'),

            # 系统管理 sub
            ('perms_systemconfig','系统管理'),
            ('personality_perms_systemconfig','平台个性化管理'),
            ('personality_perms_systemconfig_edit','平台个性化管理_可写'),
            ('system_perms_systemconfig','系统设置'),
            ('system_perms_systemconfig_edit','系统设置_可写'),
            ('retransit_perms_systemconfig','转发设置'),
            ('retransit_perms_systemconfig_edit','转发设置_可写'),
            ('icons_perms_systemconfig','图标配置'),
            ('icons_perms_systemconfig_edit','图标配置_可写'),
            ('querylog_perms_systemconfig','日志查询'),
            ('querylog_perms_systemconfig_edit','日志查询_可写'),
        )

    def __unicode__(self):
        return self.name    

    def __str__(self):
        return self.name 

