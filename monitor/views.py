# -*- coding: utf-8 -*-
from __future__ import unicode_literals

from django.shortcuts import get_object_or_404,render,redirect
from django.http import HttpResponse,JsonResponse,HttpResponseRedirect
from django.contrib import messages

import json
import random
import datetime

from django.template.loader import render_to_string
from django.shortcuts import render,HttpResponse
from django.views import View
from django.views.generic import TemplateView, ListView, DetailView, CreateView, UpdateView,DeleteView,FormView
from django.contrib.messages.views import SuccessMessageMixin
from django.contrib import admin
from django.contrib.auth.models import Permission
from django.utils.safestring import mark_safe
from django.urls import reverse_lazy
from django.contrib.auth.mixins import LoginRequiredMixin

from accounts.models import User,MyRoles

from legacy.models import HdbFlowDataDay,HdbFlowDataMonth

from entm.models import Organizations
# from django.core.urlresolvers import reverse_lazy


def dmastasticinfo():
    organ = Organizations.objects.first()
    organs = organ.get_descendants(include_self=True)

    dmas = None
    for o in organs:
        if dmas is None:
            dmas = o.dma.all()
        else:
            dmas |= o.dma.all()

    data = []
    for dma in dmas:

        dmastation = dma.dmastation.first()
        if dmastation is None:
            continue
        commaddr = dmastation.station_id

        dmaflow = 0
        month_sale = 0
        lastmonth_sale = 0
        bili = 0
        today = datetime.date.today()
        today_str = today.strftime("%Y-%m-%d")
        today_flow = HdbFlowDataDay.objects.filter(commaddr=commaddr).filter(hdate=today_str)
        if today_flow.exists():
            dmaflow = today_flow.first().dosage

        month_str = today.strftime("%Y-%m")
        month_flow = HdbFlowDataMonth.objects.filter(commaddr=commaddr).filter(hdate=month_str)
        if month_flow.exists():
            month_sale = month_flow.first().dosage

        lastmonth = datetime.datetime(year=today.year,month=today.month-1,day=1)
        lastmonth_str = lastmonth.strftime("%Y-%m")
        lastmonth_flow = HdbFlowDataMonth.objects.filter(commaddr=commaddr).filter(hdate=lastmonth_str)
        if lastmonth_flow.exists():
            lastmonth_sale = lastmonth_flow.first().dosage

        if float(month_sale) > 0 and float(lastmonth_sale) > 0:
            bili =  (float(month_sale) - float(lastmonth_sale) ) / float(lastmonth_sale)

        data.append(
            {
                "dma_name":dma.dma_name,
                "belongto":dma.belongto.name,
                "dma_level":"二级",
                "dma_status":"在线",
                "dmaflow":round(float(dmaflow),2),
                "month_sale":round(float(month_sale),2),
                "lastmonth_sale":round(float(lastmonth_sale),2),
                "bili":round(bili,2)
            }
        )

    return data

        
class MapMonitorView(TemplateView):
    template_name = "monitor/mapmonitor.html"

    def get_context_data(self, *args, **kwargs):
        context = super(MapMonitorView, self).get_context_data(*args, **kwargs)
        context["page_menu"] = "数据监控"
        # context["page_submenu"] = "组织和用户管理"
        context["page_title"] = "地图监控"

        stat_list = dmastasticinfo()
        statsinfo = json.dumps({"statsinfo":stat_list})
        
        context["dmastasticinfo"] = statsinfo

        

        return context          


class MapMonitorView2(TemplateView):
    template_name = "monitor/mapmonitor2.html"

    def get_context_data(self, *args, **kwargs):
        context = super(MapMonitorView2, self).get_context_data(*args, **kwargs)
        context["page_menu"] = "数据监控"
        # context["page_submenu"] = "组织和用户管理"
        context["page_title"] = "地图监控"

        stat_list = dmastasticinfo()
        statsinfo = json.dumps({"statsinfo":stat_list})
        
        context["dmastasticinfo"] = statsinfo
        

        return context          



class MapStationView(TemplateView):
    template_name = "monitor/mapstation.html"

    def get_context_data(self, *args, **kwargs):
        context = super(MapStationView, self).get_context_data(*args, **kwargs)
        context["page_menu"] = "数据监控"
        # context["page_submenu"] = "组织和用户管理"
        context["page_title"] = "站点监控"

        stat_list = dmastasticinfo()
        statsinfo = json.dumps({"statsinfo":stat_list})
        
        context["dmastasticinfo"] = statsinfo

        

        return context          


class RealTimeDataView(TemplateView):
    template_name = "monitor/realtimedata.html"

    def get_context_data(self, *args, **kwargs):
        context = super(RealTimeDataView, self).get_context_data(*args, **kwargs)
        context["page_menu"] = "数据监控"
        # context["page_submenu"] = "组织和用户管理"
        context["page_title"] = "实时数据"

        stations = self.request.user.station_list_queryset('')

        total_station_num = len(stations)
        online_station = stations.filter(meter__state=1)
        online_station_num = len(online_station)
        biguser_station = stations.filter(biguser=1)
        biguser_station_num = len(biguser_station)
        focus_station = stations.filter(focus=1)
        focus_station_num = len(focus_station)

        alarm_station_num = 0

        context["total_station_num"] = total_station_num
        context["online_station_num"] = online_station_num
        context["offline_station_num"] = total_station_num - online_station_num
        context["biguser_station_num"] = biguser_station_num
        context["focus_station_num"] = focus_station_num
        context["alarm_station_num"] = alarm_station_num

        return context          


def stationlist(request):
    
    draw = 1
    length = 0
    start=0
    print('userlist:',request.user)
    if request.method == "GET":
        draw = int(request.GET.get("draw", 1))
        length = int(request.GET.get("length", 10))
        start = int(request.GET.get("start", 0))
        search_value = request.GET.get("search[value]", None)
        # order_column = request.GET.get("order[0][column]", None)[0]
        # order = request.GET.get("order[0][dir]", None)[0]
        groupName = request.GET.get("groupName")
        simpleQueryParam = request.POST.get("simpleQueryParam")
        # print("simpleQueryParam",simpleQueryParam)

    if request.method == "POST":
        draw = int(request.POST.get("draw", 1))
        length = int(request.POST.get("length", 10))
        start = int(request.POST.get("start", 0))
        pageSize = int(request.POST.get("pageSize", 10))
        search_value = request.POST.get("search[value]", None)
        order_column = int(request.POST.get("order[0][column]", None))
        order = request.POST.get("order[0][dir]", None)
        groupName = request.POST.get("groupName")
        districtId = request.POST.get("districtId")
        simpleQueryParam = request.POST.get("simpleQueryParam")
        # print(request.POST.get("draw"))
        print("groupName",groupName)
        print("districtId:",districtId)
        # print("post simpleQueryParam",simpleQueryParam)
    print("order_column:",order_column)
    print("order:",order)

    print("get userlist:",draw,length,start,search_value)

    user = request.user
    organs = user.belongto

    stations = user.station_list_queryset(simpleQueryParam) 
    # if order == "asc":
    #     stations = user.station_list_queryset(simpleQueryParam).order_by("meter__serialnumber")
    # else:
    #     stations = user.station_list_queryset(simpleQueryParam).order_by("-meter__serialnumber")

    # meters = Meter.objects.all()
    if groupName != "":
        stations = stations.filter(belongto__uuid=groupName)
    
    data = []
    import time
    time_start=time.time()
    for m in stations:  #[start:start+length]
        ret=m.realtimedata
        if ret is not None:
            data.append(ret)
    elapsed_time = time.time() - time_start
    print("elapsed_time ",elapsed_time)

    # sorted_data = sorted(data, key=lambda x: x["readtime"])
    # # print(sorted_data)
    # if order == "desc":
    #     sorted_data = sorted_data[::-1]

    recordsTotal = stations.count()
    # recordsTotal = len(data)
    
    result = dict()
    result["records"] = data
    result["draw"] = draw
    result["success"] = "true"
    result["pageSize"] = pageSize
    result["totalPages"] = recordsTotal/pageSize
    result["recordsTotal"] = recordsTotal
    result["recordsFiltered"] = recordsTotal
    result["start"] = 0
    result["end"] = 0

    print(draw,pageSize,recordsTotal/pageSize,recordsTotal)
    
    return HttpResponse(json.dumps(result))